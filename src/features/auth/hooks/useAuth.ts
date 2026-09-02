import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabaseClient";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: sessionResult }) => {
      setAuthState({
        user: sessionResult.session?.user ?? null,
        session: sessionResult.session,
        loading: false,
      });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({ user: session?.user ?? null, session, loading: false });
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function signInWithMagicLink(email: string) {
    const { error: signInError } = await supabase.auth.signInWithOtp({ email });
    if (signInError) throw signInError;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { ...authState, signInWithMagicLink, signOut };
}
