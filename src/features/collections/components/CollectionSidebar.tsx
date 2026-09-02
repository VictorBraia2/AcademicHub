import { useState } from "react";
import type { Collection } from "../types";

interface CollectionSidebarProps {
  collections: Collection[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, project?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CollectionSidebar({
  collections,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: CollectionSidebarProps) {
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  async function handleCreate() {
    const trimmedName = newCollectionName.trim();
    if (!trimmedName) return;
    await onCreate(trimmedName);
    setNewCollectionName("");
    setIsCreatingCollection(false);
  }

  // TODO: window.confirm é feio e não combina com o resto da UI, mas
  // excluir uma coleção apaga as fontes salvas dela em cascata (ver
  // supabase/migrations/0001_init.sql) e isso não tem desfazer. Um modal
  // de verdade fica pra quando sobrar tempo — por ora, isso evita o clique
  // acidental no "excluir" que fica só meio-visível no hover.
  function handleDeleteClick(collectionId: string, collectionName: string) {
    const confirmed = window.confirm(
      `Excluir "${collectionName}"? Isso apaga também todas as fontes salvas dentro dela.`
    );
    if (confirmed) onDelete(collectionId);
  }

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="lg:sticky lg:top-6">
        <p className="text-sm font-medium text-ink mb-2">Coleções</p>

        <div className="space-y-1 mb-3">
          {collections.map((collection) => (
            <div key={collection.id} className="group flex items-center">
              <button
                onClick={() => onSelect(collection.id)}
                className="drawer-tab flex-1 text-left"
                data-active={activeId === collection.id ? "true" : "false"}
              >
                {collection.name}
              </button>
              <button
                onClick={() => handleDeleteClick(collection.id, collection.name)}
                className="opacity-0 group-hover:opacity-100 text-xs text-stamp/70 hover:text-stamp px-2"
                title="Excluir coleção"
              >
                excluir
              </button>
            </div>
          ))}
          {collections.length === 0 && <p className="text-sm text-ink/45 px-2">Nenhuma coleção ainda.</p>}
        </div>

        {isCreatingCollection ? (
          <div className="flex gap-1 px-2">
            <input
              autoFocus
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nome da coleção"
              className="field-input flex-1 text-sm"
            />
            <button onClick={handleCreate} className="btn-primary text-sm px-2">
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingCollection(true)}
            className="text-sm text-library hover:text-library-dark px-2"
          >
            + nova coleção
          </button>
        )}
      </div>
    </aside>
  );
}
