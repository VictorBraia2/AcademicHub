import { useState } from "react";
import { CITATION_FORMAT_LABELS, formatCitation } from "./formatCitation";
import { copyText } from "@/shared/utils/clipboard";
import type { AcademicSource } from "@/features/search/types";
import type { CitationFormat } from "./types";

interface CitationExporterProps {
  source: AcademicSource;
}

const CITATION_FORMATS: CitationFormat[] = ["abnt", "apa", "ieee", "bibtex"];

export function CitationExporter({ source: academicSource }: CitationExporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [citationFormat, setCitationFormat] = useState<CitationFormat>("abnt");
  const [isCopied, setIsCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const citationText = formatCitation(academicSource, citationFormat);

  async function copyCitationToClipboard() {
    const succeeded = await copyText(citationText);
    if (succeeded) {
      setCopyFailed(false);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    } else {
      // Sem clipboard e sem fallback funcionando (raro, mas acontece em
      // iframes sandboxed) — avisa em vez de fingir que copiou.
      setCopyFailed(true);
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)} className="btn-secondary text-xs">
        Citar
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-80 bg-card border border-rule shadow-none rounded-card p-3 right-0">
          <div className="flex gap-1 mb-2">
            {CITATION_FORMATS.map((formatOption) => (
              <button
                key={formatOption}
                onClick={() => setCitationFormat(formatOption)}
                className={`text-xs px-2 py-1 rounded-card border ${
                  citationFormat === formatOption
                    ? "border-library text-library-dark bg-paper"
                    : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                {CITATION_FORMAT_LABELS[formatOption]}
              </button>
            ))}
          </div>

          <textarea
            readOnly
            value={citationText}
            rows={citationFormat === "bibtex" ? 7 : 4}
            className={`w-full text-xs p-2 border border-rule bg-paper text-ink resize-none rounded-card ${
              citationFormat === "bibtex" ? "font-mono" : "font-body"
            }`}
          />

          <button onClick={copyCitationToClipboard} className="btn-primary text-xs mt-2 w-full">
            {isCopied ? "Copiado!" : "Copiar citação"}
          </button>
          {copyFailed && (
            <p className="text-stamp text-xs mt-1">
              Não consegui copiar automaticamente — selecione o texto acima e copie manualmente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
