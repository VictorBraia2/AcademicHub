import { useState } from "react";
import { logger } from "@/shared/utils/logger";
import type { AcademicSource } from "../types";

interface RelevancePanelProps {
  query: string;
  source: AcademicSource;
}

// Uma justificativa já gerada não muda entre reaberturas do painel na mesma
// sessão — evita nova chamada à Anthropic API por clique repetido.
// TODO: esse Map nunca é limpo, então numa sessão muito longa com muita
// busca ele cresce sem limite. Na prática seriam centenas de entradas de
// texto curto pra isso incomodar, mas se virar problema, trocar por um
// LRU simples com teto de ~200 entradas.
const relevanceExplanationCache = new Map<string, string>();

export function RelevancePanel({ query, source }: RelevancePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [relevanceError, setRelevanceError] = useState<string | null>(null);

  async function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (explanation || isLoading) return;

    const cacheKey = `${query}::${source.title}`;
    const cachedExplanation = relevanceExplanationCache.get(cacheKey);
    if (cachedExplanation) {
      setExplanation(cachedExplanation);
      return;
    }

    setIsLoading(true);
    setRelevanceError(null);
    try {
      const httpResponse = await fetch("/api/relevance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, title: source.title, abstract: source.abstract }),
      });
      if (!httpResponse.ok) {
        if (httpResponse.status === 429) {
          throw new Error("Muita gente pedindo justificativa agora — tenta de novo em alguns segundos.");
        }
        const errorBody = await httpResponse.text().catch(() => "");
        throw new Error(`Erro ${httpResponse.status}: ${errorBody || httpResponse.statusText}`);
      }
      const { explanation: generatedExplanation } = (await httpResponse.json()) as { explanation: string };
      relevanceExplanationCache.set(cacheKey, generatedExplanation);
      setExplanation(generatedExplanation);
    } catch (err) {
      logger.error("Falha ao gerar justificativa de relevância", {
        query,
        title: source.title,
        error: err instanceof Error ? err.message : String(err),
      });
      setRelevanceError(err instanceof Error ? err.message : "Não foi possível gerar a justificativa agora.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className="text-sm text-library hover:text-library-dark font-body underline decoration-rule underline-offset-4"
      >
        {isOpen ? "Ocultar por que é relevante" : "Por que esta fonte é útil para minha pesquisa?"}
      </button>

      {isOpen && (
        <div className="margin-note mt-3 py-1 text-sm text-ink/80 max-w-prose">
          {isLoading && <p className="italic text-ink/50">Lendo o resumo e comparando com sua busca…</p>}
          {relevanceError && <p className="text-stamp">{relevanceError}</p>}
          {explanation && (
            <>
              <p>{explanation}</p>
              <p className="text-xs text-ink/40 mt-2">
                Gerado por IA a partir do resumo — confira o artigo original antes de citar.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
