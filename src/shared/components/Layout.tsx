import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface LayoutProps {
  children: ReactNode;
  user: User | null;
  onSignOut: () => void;
}

export function Layout({ children, user, onSignOut }: LayoutProps) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-drawer text-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl italic">AcademicHub</span>
            <span className="hidden sm:inline text-xs text-card/60 font-body">
              catálogo de fontes de pesquisa
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className="drawer-tab text-card/80"
              data-active={location.pathname === "/" ? "true" : "false"}
              style={
                location.pathname === "/"
                  ? { borderLeftColor: "#B4903F", background: "transparent", color: "#F8F6F0" }
                  : undefined
              }
            >
              Busca
            </Link>
            <Link
              to="/biblioteca"
              className="drawer-tab text-card/80"
              data-active={location.pathname.startsWith("/biblioteca") ? "true" : "false"}
              style={
                location.pathname.startsWith("/biblioteca")
                  ? { borderLeftColor: "#B4903F", background: "transparent", color: "#F8F6F0" }
                  : undefined
              }
            >
              Minha biblioteca
            </Link>
          </nav>

          <div className="text-sm">
            {user ? (
              <button onClick={onSignOut} className="text-card/70 hover:text-card transition-colors">
                Sair ({user.email})
              </button>
            ) : (
              <Link to="/entrar" className="text-card/70 hover:text-card transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">{children}</main>

      <footer className="border-t border-rule">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-ink/50 font-body">
          Metadados via OpenAlex, Crossref, Semantic Scholar e Google Books. Status de acesso aberto
          verificado com Unpaywall.
        </div>
      </footer>
    </div>
  );
}
