import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface LayoutProps {
  children: ReactNode;
  user: User | null;
  onSignOut: () => void;
}

function BookMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brass shrink-0"
    >
      <path d="M12 6.5c-1.8-1.3-4.2-2-6.5-2-.6 0-1 .1-1.5.2v12.8c.5-.1.9-.2 1.5-.2 2.3 0 4.7.7 6.5 2" />
      <path d="M12 6.5c1.8-1.3 4.2-2 6.5-2 .6 0 1 .1 1.5.2v12.8c-.5-.1-.9-.2-1.5-.2-2.3 0-4.7.7-6.5 2" />
      <line x1="12" y1="6.5" x2="12" y2="19.3" />
    </svg>
  );
}

export function Layout({ children, user, onSignOut }: LayoutProps) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-drawer text-card border-b-2 border-brass/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <BookMark />
            <span className="flex items-baseline gap-2">
              <span className="font-display text-xl italic">AcademicHub</span>
              <span className="hidden sm:inline text-xs text-card/55 font-body tracking-wide">
                catálogo de fontes de pesquisa
              </span>
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>

      <footer className="border-t border-rule">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-ink/50 font-body">
          Metadados via OpenAlex, Crossref, Semantic Scholar e DOAJ. Status de acesso aberto verificado com
          Unpaywall.
        </div>
      </footer>
    </div>
  );
}
