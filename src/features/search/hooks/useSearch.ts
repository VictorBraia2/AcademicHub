import { useState } from "react";
import { logger } from "@/shared/utils/logger";
import type { SearchFilters, SearchResponse } from "../types";

// Buscas de 1 caractere só devolvem ruído nas APIs acadêmicas (testei com
// "a" no OpenAlex — 200+ resultados irrelevantes) e ainda gastam uma
// chamada de cada provedor à toa. Vale barrar antes de sair da tela.
const MIN_QUERY_LENGTH = 2;

function buildSearchParams(filters: SearchFilters): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.set("query", filters.query);
  if (filters.yearFrom) searchParams.set("yearFrom", String(filters.yearFrom));
  if (filters.yearTo) searchParams.set("yearTo", String(filters.yearTo));
  if (filters.documentType) searchParams.set("documentType", filters.documentType);
  if (filters.language) searchParams.set("language", filters.language);
  if (filters.accessOnly) searchParams.set("accessOnly", filters.accessOnly);
  return searchParams;
}

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>({ query: "" });
  const [searchQueryResponse, setSearchQueryResponse] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function runSearch(nextFilters: SearchFilters) {
    const trimmedQuery = nextFilters.query.trim();
    setFilters(nextFilters);
    setHasSearched(true);

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      // hasSearched precisa ir pra true aqui também, senão a SearchPage
      // (que só renderiza a área de erro depois da primeira busca) nunca
      // chega a mostrar essa mensagem. Achei isso testando com "a".
      setSearchError(`Digite pelo menos ${MIN_QUERY_LENGTH} caracteres para buscar.`);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const httpResponse = await fetch(`/api/search?${buildSearchParams(nextFilters).toString()}`);
      if (!httpResponse.ok) {
        const errorBody = await httpResponse.text().catch(() => "");
        throw new Error(
          `Erro ${httpResponse.status} ao buscar fontes: ${errorBody || httpResponse.statusText}`
        );
      }
      setSearchQueryResponse((await httpResponse.json()) as SearchResponse);
    } catch (err) {
      // Sem contexto (query, filtros) um "fetch failed" solto no console não
      // ajuda a debugar nada depois de o usuário já ter saído da página.
      logger.error("Falha ao buscar fontes acadêmicas", {
        query: nextFilters.query,
        filters: nextFilters,
        error: err instanceof Error ? err.message : String(err),
      });
      setSearchError(err instanceof Error ? err.message : "Não foi possível completar a busca.");
    } finally {
      setIsSearching(false);
    }
  }

  return {
    filters,
    searchQueryResponse,
    isSearching,
    searchError,
    hasSearched,
    search: (query: string) => runSearch({ ...filters, query }),
    updateFilters: (nextFilters: SearchFilters) => {
      if (hasSearched && nextFilters.query) runSearch(nextFilters);
      else setFilters(nextFilters);
    },
  };
}
