import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CollectionSidebar } from "./components/CollectionSidebar";
import { NoteEditor } from "./components/NoteEditor";
import { CitationExporter } from "@/features/citations/CitationExporter";
import { useCollections, useSavedSources } from "./hooks/useCollections";

interface LibraryPageProps {
  user: User | null;
}

export function LibraryPage({ user }: LibraryPageProps) {
  const { collections, createCollection, deleteCollection } = useCollections(user?.id);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  useEffect(() => {
    if (!activeCollectionId && collections.length > 0) setActiveCollectionId(collections[0].id);
  }, [collections, activeCollectionId]);
  const {
    sources: savedSources,
    updateNotes,
    removeSource,
  } = useSavedSources(activeCollectionId ?? undefined);
  if (!user) {
    return (
      <div className="max-w-prose catalog-card p-8">
        <h2 className="font-display text-2xl mb-2">Minha biblioteca</h2>
        <p className="text-ink/60 text-sm">
          Entre com seu e-mail para salvar fontes em coleções pessoais e adicionar anotações.
        </p>
      </div>
    );
  }
  const activeCollection = collections.find((collection) => collection.id === activeCollectionId);
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <CollectionSidebar
        collections={collections}
        activeId={activeCollectionId}
        onSelect={setActiveCollectionId}
        onCreate={async (name, project) => {
          const newCollection = await createCollection(name, project);
          setActiveCollectionId(newCollection.id);
        }}
        onDelete={async (collectionId) => {
          await deleteCollection(collectionId);
          if (activeCollectionId === collectionId) setActiveCollectionId(null);
        }}
      />

      <div className="flex-1 min-w-0">
        {!activeCollection && (
          <p className="text-ink/50 text-sm">Crie ou selecione uma coleção para ver as fontes salvas.</p>
        )}

        {activeCollection && (
          <>
            <div className="mb-5">
              <h2 className="font-display text-2xl">{activeCollection.name}</h2>
              <p className="ornamental-rule mt-2 max-w-[200px]">
                <span className="font-display italic text-brass text-xs">
                  {savedSources.length} {savedSources.length === 1 ? "fonte" : "fontes"}
                </span>
              </p>
            </div>

            {savedSources.length === 0 && (
              <p className="text-ink/50 text-sm">
                Nenhuma fonte salva nesta coleção ainda. Salve resultados a partir da busca.
              </p>
            )}

            <div className="space-y-4">
              {savedSources.map((savedSource) => (
                <article key={savedSource.id} className="catalog-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-1.5">
                    <h3 className="font-display text-xl leading-snug">{savedSource.source.title}</h3>
                    <button
                      onClick={() => removeSource(savedSource.id)}
                      className="text-xs text-stamp/70 hover:text-stamp shrink-0"
                    >
                      remover
                    </button>
                  </div>
                  <p className="text-sm text-ink/70 mb-1">
                    {savedSource.source.authors.map((sourceAuthor) => sourceAuthor.name).join("; ")}
                  </p>
                  {(savedSource.source.venue || savedSource.source.year) && (
                    <p className="text-sm text-ink/50 mb-3.5">
                      {savedSource.source.venue && (
                        <span className="venue-title">{savedSource.source.venue}</span>
                      )}
                      {savedSource.source.venue && savedSource.source.year && ", "}
                      {savedSource.source.year}
                    </p>
                  )}

                  <div className="mb-3.5">
                    <NoteEditor
                      initialNotes={savedSource.notes}
                      onSave={(notes) => updateNotes(savedSource.id, notes)}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-rule pt-3.5">
                    {savedSource.source.access.openAccessPdfUrl ? (
                      <a
                        href={savedSource.source.access.openAccessPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-library hover:text-library-dark underline decoration-rule underline-offset-4"
                      >
                        Ler PDF
                      </a>
                    ) : (
                      <span />
                    )}
                    <CitationExporter source={savedSource.source} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
