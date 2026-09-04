import { useState } from "react";
import type { Collection } from "../types";

interface SaveToCollectionMenuProps {
  collections: Collection[];
  isAuthenticated: boolean;
  onSave: (collectionId: string) => Promise<void>;
  onCreateAndSave: (name: string) => Promise<void>;
  onRequireLogin: () => void;
}

export function SaveToCollectionMenu({
  collections,
  isAuthenticated,
  onSave,
  onCreateAndSave,
  onRequireLogin,
}: SaveToCollectionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  function handleToggle() {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    setIsOpen((prevIsOpen) => !prevIsOpen);
  }
  async function handleSave(collectionId: string) {
    await onSave(collectionId);
    setIsSaved(true);
    setIsOpen(false);
    setTimeout(() => setIsSaved(false), 1800);
  }
  async function handleCreateAndSave() {
    const trimmedName = newCollectionName.trim();
    if (!trimmedName) return;
    await onCreateAndSave(trimmedName);
    setNewCollectionName("");
    setIsCreatingCollection(false);
    setIsSaved(true);
    setIsOpen(false);
    setTimeout(() => setIsSaved(false), 1800);
  }
  return (
    <div className="relative">
      <button onClick={handleToggle} className="btn-secondary text-xs">
        {isSaved ? "Salvo na coleção" : "Salvar"}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-card border border-rule rounded-card p-2 right-0">
          {collections.length === 0 && !isCreatingCollection && (
            <p className="text-xs text-ink/50 px-2 py-1">Você ainda não tem coleções.</p>
          )}

          <div className="max-h-40 overflow-y-auto">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => handleSave(collection.id)}
                className="block w-full text-left text-sm px-2 py-1.5 hover:bg-paper rounded-card"
              >
                {collection.name}
              </button>
            ))}
          </div>

          <div className="border-t border-rule mt-2 pt-2">
            {isCreatingCollection ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndSave()}
                  placeholder="Nome da coleção"
                  className="field-input flex-1 text-xs"
                />
                <button onClick={handleCreateAndSave} className="btn-primary text-xs px-2">
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingCollection(true)}
                className="text-xs text-library hover:text-library-dark px-2 py-1"
              >
                + nova coleção
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
