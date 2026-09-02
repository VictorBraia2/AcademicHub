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
    <div className="bg-drawer -mx-6 px-6 py-10 sm:py-14 mb-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="font-display text-3xl sm:text-4xl text-card mb-2">
          Encontre a fonte certa para sua pesquisa
        </h1>
        <p className="text-card/60 text-sm mb-7 max-w-prose mx-auto">
          Busque por assunto, autor ou DOI. Artigos, livros e teses de várias bases, já organizados em um só
          lugar.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            placeholder='Ex.: "modelos de visão computacional em defesa" ou 10.1145/3442188.3445922'
            className="flex-1 bg-card text-ink px-4 py-3 text-sm border border-transparent focus:border-brass outline-none rounded-card"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brass text-drawer px-5 py-3 text-sm font-body font-medium rounded-card disabled:opacity-60"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </form>
      </div>
    </div>
  );
}
