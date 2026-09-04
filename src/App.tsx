import { Route, Routes } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { SearchPage } from "@/features/search/SearchPage";
import { LibraryPage } from "@/features/collections/LibraryPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function App() {
  const { user, loading, signOut } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/40 text-sm">Carregando…</div>
    );
  }
  return (
    <Layout user={user} onSignOut={signOut}>
      <Routes>
        <Route path="/" element={<SearchPage user={user} />} />
        <Route path="/biblioteca" element={<LibraryPage user={user} />} />
        <Route path="/entrar" element={<LoginPage />} />
      </Routes>
    </Layout>
  );
}
