export type DocumentType = "article" | "book" | "thesis" | "chapter" | "other";

export type AccessStatus = "open" | "paywalled" | "unknown";

export interface SourceAuthor {
  name: string;
}

export interface AcademicSource {
  /** Identificador estável, gerado a partir do DOI ou da fonte de origem */
  id: string;
  title: string;
  authors: SourceAuthor[];
  year: number | null;
  venue: string | null;
  documentType: DocumentType;
  abstract: string | null;
  doi: string | null;
  citationCount: number | null;
  language: string | null;
  /** De onde os metadados vieram (para transparência e depuração) */
  sourceProvider: "openalex" | "crossref" | "semantic_scholar" | "google_books";
  access: {
    status: AccessStatus;
    /** Link direto para PDF legal e gratuito, quando existe */
    openAccessPdfUrl: string | null;
    /** Link de compra ou acesso na editora/loja, quando a fonte é paga */
    purchaseUrl: string | null;
  };
}

export interface SearchFilters {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  documentType?: DocumentType;
  language?: string;
  accessOnly?: "open" | "any";
}

export interface SearchResponse {
  results: AcademicSource[];
  totalEstimate: number;
  providerErrors: Partial<Record<AcademicSource["sourceProvider"], string>>;
}

export interface RelevanceRequest {
  query: string;
  title: string;
  abstract: string | null;
}

export interface RelevanceResponse {
  explanation: string;
}
