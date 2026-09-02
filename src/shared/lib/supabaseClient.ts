import { createClient } from "@supabase/supabase-js";
import { logger } from "@/shared/utils/logger";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha alto e claro em vez de deixar toda chamada ao Supabase quebrar
  // silenciosamente depois com um erro de rede confuso. Ver README (seção
  // "Variáveis de ambiente") pra configurar isso no Vercel.
  logger.error("Variáveis de ambiente do Supabase ausentes", {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
  });
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
