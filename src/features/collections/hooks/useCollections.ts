import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabaseClient";
import { logger } from "@/shared/utils/logger";
import type { AcademicSource } from "@/features/search/types";
import type { Collection, SavedSource } from "../types";

function mapRowToCollection(collectionRow: any): Collection {
  return {
    id: collectionRow.id,
    userId: collectionRow.user_id,
    name: collectionRow.name,
    project: collectionRow.project,
    createdAt: collectionRow.created_at,
  };
}

function mapRowToSavedSource(savedSourceRow: any): SavedSource {
  return {
    id: savedSourceRow.id,
    collectionId: savedSourceRow.collection_id,
    userId: savedSourceRow.user_id,
    source: savedSourceRow.source as AcademicSource,
    notes: savedSourceRow.notes ?? "",
    createdAt: savedSourceRow.created_at,
    updatedAt: savedSourceRow.updated_at,
  };
}

export function useCollections(userId: string | undefined) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!userId) {
      setCollections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: collectionRows, error: fetchError } = await supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) {
      logger.error("Falha ao carregar coleções do Supabase", { userId, error: fetchError.message });
    } else if (collectionRows) {
      setCollections(collectionRows.map(mapRowToCollection));
    }
    setLoading(false);
  }, [userId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  async function createCollection(name: string, project?: string) {
    if (!userId) throw new Error("Usuário não autenticado.");
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Nome da coleção não pode ficar em branco.");
    const { data: insertedRow, error: insertError } = await supabase
      .from("collections")
      .insert({ user_id: userId, name: trimmedName, project: project?.trim() || null })
      .select()
      .single();
    if (insertError) {
      logger.error("Falha ao criar coleção", { userId, name: trimmedName, error: insertError.message });
      throw insertError;
    }
    const newCollection = mapRowToCollection(insertedRow);
    setCollections((previousCollections) => [newCollection, ...previousCollections]);
    return newCollection;
  }
  async function deleteCollection(collectionId: string) {
    const { error: deleteError } = await supabase.from("collections").delete().eq("id", collectionId);
    if (deleteError) {
      logger.error("Falha ao excluir coleção", { collectionId, error: deleteError.message });
      throw deleteError;
    }
    setCollections((previousCollections) =>
      previousCollections.filter((collection) => collection.id !== collectionId)
    );
  }
  return { collections, loading, createCollection, deleteCollection, refresh };
}

export function useSavedSources(collectionId: string | undefined) {
  const [sources, setSources] = useState<SavedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!collectionId) {
      setSources([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: savedSourceRows, error: fetchError } = await supabase
      .from("saved_sources")
      .select("*")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: false });
    if (fetchError) {
      logger.error("Falha ao carregar fontes salvas", { collectionId, error: fetchError.message });
    } else if (savedSourceRows) {
      setSources(savedSourceRows.map(mapRowToSavedSource));
    }
    setLoading(false);
  }, [collectionId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  async function saveSource(userId: string, targetCollectionId: string, academicSource: AcademicSource) {
    const { data: insertedRow, error: insertError } = await supabase
      .from("saved_sources")
      .insert({ user_id: userId, collection_id: targetCollectionId, source: academicSource, notes: "" })
      .select()
      .single();
    if (insertError) {
      logger.error("Falha ao salvar fonte na coleção", {
        userId,
        collectionId: targetCollectionId,
        sourceId: academicSource.id,
        error: insertError.message,
      });
      throw insertError;
    }
    const newSavedSource = mapRowToSavedSource(insertedRow);
    setSources((previousSources) => [newSavedSource, ...previousSources]);
    return newSavedSource;
  }
  async function updateNotes(savedSourceId: string, notes: string) {
    const { error: updateError } = await supabase
      .from("saved_sources")
      .update({ notes })
      .eq("id", savedSourceId);
    if (updateError) {
      logger.error("Falha ao salvar anotação", { savedSourceId, error: updateError.message });
      throw updateError;
    }
    setSources((previousSources) =>
      previousSources.map((savedSource) =>
        savedSource.id === savedSourceId ? { ...savedSource, notes } : savedSource
      )
    );
  }
  async function removeSource(savedSourceId: string) {
    const { error: deleteError } = await supabase.from("saved_sources").delete().eq("id", savedSourceId);
    if (deleteError) {
      logger.error("Falha ao remover fonte salva", { savedSourceId, error: deleteError.message });
      throw deleteError;
    }
    setSources((previousSources) =>
      previousSources.filter((savedSource) => savedSource.id !== savedSourceId)
    );
  }
  return { sources, loading, saveSource, updateNotes, removeSource, refresh };
}
