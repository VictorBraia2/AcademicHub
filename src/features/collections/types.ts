import type { AcademicSource } from "@/features/search/types";

export interface SavedSource {
  id: string;
  collectionId: string;
  userId: string;
  source: AcademicSource;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  project: string | null;
  createdAt: string;
}
