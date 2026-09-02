import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { RelevanceRequest, RelevanceResponse } from "../src/features/search/types";
import { logger } from "../src/shared/utils/logger";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const RELEVANCE_MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }
  if (!ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor." });
    return;
  }

  const relevanceRequest = req.body as RelevanceRequest;
  if (!relevanceRequest?.query || !relevanceRequest?.title) {
    res.status(400).json({ error: "Campos 'query' e 'title' são obrigatórios." });
    return;
  }
  const abstractSnippet = (relevanceRequest.abstract ?? "").slice(0, 1600);

  const relevancePrompt = [
    `Termo de pesquisa do usuário: "${relevanceRequest.query}"`,
    `Título da fonte: "${relevanceRequest.title}"`,
    abstractSnippet
      ? `Resumo/abstract da fonte:\n${abstractSnippet}`
      : "Esta fonte não possui resumo/abstract disponível nos metadados.",
    "",
    "Em até 3 frases, em português do Brasil, explique objetivamente por que esta fonte",
    "pode (ou não) ser útil para quem pesquisa o termo acima. Seja específico sobre",
    "o que a fonte realmente aborda — não genérico. Se o resumo não permitir avaliar",
    "com confiança, diga isso explicitamente em vez de especular.",
  ].join("\n");

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: RELEVANCE_MODEL,
        max_tokens: 220,
        messages: [{ role: "user", content: relevancePrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text().catch(() => "");
      logger.warn("Anthropic API recusou a chamada de relevância", {
        status: anthropicResponse.status,
        title: relevanceRequest.title,
      });
      if (anthropicResponse.status === 429) {
        res.status(429).json({ error: "Limite de requisições à IA atingido — tenta de novo em instantes." });
        return;
      }
      res
        .status(502)
        .json({ error: `Falha ao consultar o modelo (${anthropicResponse.status}): ${errorBody}` });
      return;
    }

    const anthropicPayload = await anthropicResponse.json();
    const explanation: string =
      anthropicPayload.content
        ?.filter((contentBlock: any) => contentBlock.type === "text")
        .map((contentBlock: any) => contentBlock.text)
        .join("\n")
        .trim() ?? "";

    if (!explanation) {
      res.status(502).json({ error: "Resposta do modelo veio vazia." });
      return;
    }

    const relevanceResponse: RelevanceResponse = { explanation };
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(relevanceResponse);
  } catch (err) {
    logger.error("Falha inesperada ao gerar justificativa de relevância", {
      title: relevanceRequest.title,
      error: err instanceof Error ? err.message : String(err),
    });
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Erro inesperado ao gerar justificativa." });
  }
}
