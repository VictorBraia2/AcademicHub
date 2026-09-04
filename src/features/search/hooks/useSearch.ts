import { useState } from "react";
import { logger } from "@/shared/utils/logger";
import type { SearchFilters, SearchResponse } from "../types";

const MIN_QUERY_LENGTH = 2;
const MAX_TERMS = 3;
const PAGE_SIZE = 20;

function splitTerms(rawQuery: string): string[] {
  return Array.from(
    new Set(
      rawQuery
        .split(",")
        .map((term) => term.trim())
        .filter((term) => term.length >= MIN_QUERY_LENGTH)
    )
  ).slice(0, MAX_TERMS);
}

function buildSearchParams(filters: SearchFilters, terms: string[]): URLSearchParams {
  const searchParams = new URLSearchParams();
  terms.forEach((term) => searchParams.append("query", term));
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  async function runSearch(nextFilters: SearchFilters) {
    const terms = splitTerms(nextFilters.query);
    setFilters(nextFilters);
    setHasSearched(true);
    setVisibleCount(PAGE_SIZE);
    if (terms.length === 0) {
      setSearchError(`Digite pelo menos ${MIN_QUERY_LENGTH} caracteres para buscar.`);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      const httpResponse = await fetch(`/api/search?${buildSearchParams(nextFilters, terms).toString()}`);
      if (!httpResponse.ok) {
        const errorBody = await httpResponse.text().catch(() => "");
        throw new Error(
          `Erro ${httpResponse.status} ao buscar fontes: ${errorBody || httpResponse.statusText}`
        );
      }
      setSearchQueryResponse((await httpResponse.json()) as SearchResponse);
    } catch (err) {
      logger.error("Falha ao buscar fontes acadêmicas", {
        terms,
        filters: nextFilters,
        error: err instanceof Error ? err.message : String(err),
      });
      setSearchError(err instanceof Error ? err.message : "Não foi possível completar a busca.");
    } finally {
      setIsSearching(false);
    }
  }
  const visibleResults = searchQueryResponse?.results.slice(0, visibleCount) ?? [];
  const hasMore = (searchQueryResponse?.results.length ?? 0) > visibleCount;
  return {
    filters,
    searchQueryResponse,
    visibleResults,
    hasMore,
    loadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
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
import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { SearchResult } from '../types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('publications') 
          .select('*')
          .ilike('title', `%${query}%`);

        if (supabaseError) throw supabaseError;
        setResults(data || []);
      } catch (err: any) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, loading, error };
}
