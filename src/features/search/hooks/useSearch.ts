import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabaseClient";
import { logger } from "@/shared/utils/logger";
import type { SearchFilters, SearchResponse } from "../types";

type SearchResult = SearchResponse["results"][number];

const MIN_QUERY_LENGTH = 2;
const PAGE_SIZE = 20;

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>({ query: "" });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const rawQuery = filters.query.trim();

    if (!rawQuery) {
      setResults([]);
      setSearchError(null);
      return;
    }

    if (rawQuery.length < MIN_QUERY_LENGTH) {
      setSearchError(`Digite pelo menos ${MIN_QUERY_LENGTH} caracteres para buscar.`);
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);

      try {
        let queryBuilder = supabase
          .from("publications") 
          .select("*")
          .ilike("title", `%${rawQuery}%`);

        if (filters.yearFrom) {
          queryBuilder = queryBuilder.gte("year", filters.yearFrom);
        }
        if (filters.yearTo) {
          queryBuilder = queryBuilder.lte("year", filters.yearTo);
        }
        if (filters.documentType) {
          queryBuilder = queryBuilder.eq("document_type", filters.documentType);
        }
        if (filters.language) {
          queryBuilder = queryBuilder.eq("language", filters.language);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        setResults((data as unknown as SearchResult[]) || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao realizar busca no banco.";
        logger.error("Falha ao buscar publicações", {
          filters,
          error: errorMessage,
        });
        setSearchError(errorMessage);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  const searchQueryResponse: SearchResponse | null = hasSearched
    ? ({ results, total: results.length } as unknown as SearchResponse)
    : null;

  return {
    filters,
    results,
    searchQueryResponse,
    visibleResults,
    hasMore,
    isSearching,
    searchError,
    hasSearched,
    loadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
    search: (query: string) => {
      setVisibleCount(PAGE_SIZE);
      setFilters((prev) => ({ ...prev, query }));
    },
    updateFilters: (nextFilters: SearchFilters) => {
      setVisibleCount(PAGE_SIZE);
      setFilters(nextFilters);
    },
  };
}
