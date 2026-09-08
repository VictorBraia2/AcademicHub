import { useState, type FormEvent } from "react";

interface SearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function SearchBar({ initialValue = "", onSearch, loading }: SearchBarProps) {
  const [searchInputValue, setSearchInputValue] = useState(initialValue);
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedQuery = searchInputValue.trim();
    if (trimmedQuery) onSearch(trimmedQuery);
  }
  return (
    <div className="bg-drawer -mx-6 px-6 py-14 sm:py-20 mb-10">
      <div className="max-w-3xl mx-auto text-center">
        <p className="ornamental-rule max-w-xs mx-auto mb-5">
          <span className="font-display italic text-brass text-sm tracking-wide">Acervo</span>
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-card mb-3 leading-tight">
          Encontre a fonte certa
          <br />
          para sua pesquisa
        </h1>
        <p className="text-card/55 text-sm mb-9 max-w-prose mx-auto">
          Busque por assunto, autor ou DOI. Pode buscar até 3 temas ao mesmo tempo, separados por vírgula — os
          resultados vêm combinados numa lista só.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            placeholder="história da moda, moda na pandemia (separe temas por vírgula)"
            className="flex-1 bg-card text-ink px-4 py-3.5 text-sm border border-transparent focus:border-brass outline-none rounded-card shadow-book"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary bg-brass text-drawer px-6 disabled:opacity-60"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </form>
      </div>
    </div>
  );
}
