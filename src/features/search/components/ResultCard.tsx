import type { AcademicSource } from "@/features/search/types";
import type { Collection } from "@/features/collections/types";
import { RelevancePanel } from "./RelevancePanel";
import { CitationExporter } from "@/features/citations/CitationExporter";
import { SaveToCollectionMenu } from "@/features/collections/components/SaveToCollectionMenu";
import { pluralizeCitations } from "@/shared/utils/pluralize";

const DOCUMENT_TYPE_LABEL: Record<AcademicSource["documentType"], string> = {
  article: "Artigo",
  book: "Livro",
  thesis: "Tese/dissertação",
  chapter: "Capítulo",
  other: "Documento",
};

interface ResultCardProps {
  source: AcademicSource;
  query: string;
  collections: Collection[];
  isAuthenticated: boolean;
  onSave: (collectionId: string) => Promise<void>;
  onCreateAndSave: (name: string) => Promise<void>;
  onRequireLogin: () => void;
}

export function ResultCard({
  source: academicSource,
  query,
  collections,
  isAuthenticated,
  onSave,
  onCreateAndSave,
  onRequireLogin,
}: ResultCardProps) {
  const authorLine =
    academicSource.authors.length > 0
      ? // 4 é um número arbitrário — parecia razoável pra não estourar a
        // altura do card em telas estreitas. Ajustar se ficar estranho.
        academicSource.authors
          .slice(0, 4)
          .map((sourceAuthor) => sourceAuthor.name)
          .join("; ") + (academicSource.authors.length > 4 ? " et al." : "")
      : "Autoria não identificada";

  const venueLine = [academicSource.venue, academicSource.year].filter(Boolean).join(", ");

  return (
    <article className="catalog-card p-5">
      <div className="flex items-start justify-between gap-4 mb-1">
        <span className="text-xs text-ink/45 font-body">
          {DOCUMENT_TYPE_LABEL[academicSource.documentType]}
        </span>
        {academicSource.access.status === "open" ? (
          <span className="oa-stamp">Acesso aberto</span>
        ) : academicSource.access.status === "paywalled" ? (
          <span className="purchase-tag">acesso pago</span>
        ) : null}
      </div>

      <h3 className="font-display text-lg leading-snug mb-1">{academicSource.title}</h3>
      <p className="text-sm text-ink/70">{authorLine}</p>
      {venueLine && <p className="text-sm text-ink/50 mb-3">{venueLine}</p>}

      {academicSource.abstract && (
        <p className="text-sm text-ink/70 max-w-prose line-clamp-3 mb-3">{academicSource.abstract}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
        {academicSource.access.openAccessPdfUrl && (
          <a
            href={academicSource.access.openAccessPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-library hover:text-library-dark underline decoration-rule underline-offset-4"
          >
            Ler PDF gratuito
          </a>
        )}
        {!academicSource.access.openAccessPdfUrl && academicSource.access.purchaseUrl && (
          <a
            href={academicSource.access.purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brass hover:opacity-80 underline decoration-rule underline-offset-4"
          >
            Ver acesso/compra na editora
          </a>
        )}
        {academicSource.citationCount !== null && (
          <span className="text-ink/40">
            {academicSource.citationCount} {pluralizeCitations(academicSource.citationCount)}
          </span>
        )}
        {academicSource.doi && <span className="text-ink/30 font-mono text-xs">{academicSource.doi}</span>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule pt-3">
        <RelevancePanel query={query} source={academicSource} />
        <div className="flex items-center gap-2 shrink-0">
          <CitationExporter source={academicSource} />
          <SaveToCollectionMenu
            collections={collections}
            isAuthenticated={isAuthenticated}
            onSave={onSave}
            onCreateAndSave={onCreateAndSave}
            onRequireLogin={onRequireLogin}
          />
        </div>
      </div>
    </article>
  );
}
