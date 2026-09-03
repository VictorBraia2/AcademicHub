import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "./components/SearchBar";
import { FilterPanel } from "./components/FilterPanel";
import { ResultCard } from "./components/ResultCard";
import { useSearch } from "./hooks/useSearch";
import { useCollections, useSavedSources } from "@/features/collections/hooks/useCollections";
import type { AcademicSource } from "./types";

interface SearchPageProps {
  user: User | null;
}

export function SearchPage({ user }: SearchPageProps) {
  const navigate = useNavigate();
  const {
    filters,
    searchQueryResponse,
    visibleResults,
    hasMore,
    loadMore,
    isSearching,
    searchError,
    hasSearched,
    search,
    updateFilters,
  } = useSearch();

  const { collections, createCollection } = useCollections(user?.id);
  // Meio gambiarra: só quero a função saveSource daqui, não a lista de fontes
  // de uma coleção específica (por isso o hook recebe `undefined`). Se isso
  // incomodar de novo, vale separar saveSource num hook próprio sem o
  // "carona" da lista — por ora não valeu a pena o refactor.
  const { saveSource } = useSavedSources(undefined);

  async function handleSave(academicSource: AcademicSource, collectionId: string) {
    if (!user) return;
    await saveSource(user.id, collectionId, academicSource);
  }

  async function handleCreateAndSave(academicSource: AcademicSource, collectionName: string) {
    if (!user) return;
    const newCollection = await createCollection(collectionName);
    await saveSource(user.id, newCollection.id, academicSource);
  }

  return (
    <div>
      <SearchBar initialValue={filters.query} onSearch={search} loading={isSearching} />

      {hasSearched && (
        <div className="flex flex-col lg:flex-row gap-8">
          <FilterPanel filters={filters} onChange={updateFilters} />

          <div className="flex-1 min-w-0">
            {searchError && <p className="text-stamp text-sm mb-4">{searchError}</p>}

            {searchQueryResponse && (
              <>
                <p className="text-sm text-ink/50 mb-4">
                  {searchQueryResponse.totalEstimate} resultado(s) para <strong>"{filters.query}"</strong>
                </p>

                <div className="space-y-4">
                  {visibleResults.map((academicSource) => (
                    <ResultCard
                      key={academicSource.id}
                      source={academicSource}
                      query={filters.query}
                      collections={collections}
                      isAuthenticated={!!user}
                      onSave={(collectionId) => handleSave(academicSource, collectionId)}
                      onCreateAndSave={(collectionName) =>
                        handleCreateAndSave(academicSource, collectionName)
                      }
                      onRequireLogin={() => navigate("/entrar")}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button onClick={loadMore} className="btn-secondary text-sm mt-6 mx-auto block">
                    Carregar mais resultados
                  </button>
                )}

                {searchQueryResponse.results.length === 0 && !isSearching && (
                  <p className="text-ink/50 text-sm">
                    Nenhum resultado encontrado. Tente termos mais amplos ou remova filtros.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
