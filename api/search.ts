import type { VercelRequest, VercelResponse } from "@vercel/node";
import type {
  AcademicSource,
  DocumentType,
  SearchFilters,
  SearchResponse,
} from "../src/features/search/types";

const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY ?? "";
const CONTACT_EMAIL = process.env.ACADEMICHUB_CONTACT_EMAIL ?? "";
const SEMANTIC_SCHOLAR_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY ?? "";
const FETCH_TIMEOUT_MS = 6000;
const UNPAYWALL_TIMEOUT_MS = 3500;

const PREPRINT_SERVERS = [
  "arxiv",
  "biorxiv",
  "medrxiv",
  "research square",
  "ssrn",
  "chemrxiv",
  "preprints.org"
];

function isPreprint(source: AcademicSource): boolean {
  const venue = (source.venue ?? "").toLowerCase();
  const id = source.id.toLowerCase();
  return PREPRINT_SERVERS.some((server) => venue.includes(server) || id.includes(server));
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: abortController.signal });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .replace(/^doi:/, "");
}

function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ");
}

function calculateRelevanceScore(source: AcademicSource, queryTerms: string[]): number {
  const titleNorm = normalizeText(source.title);
  const abstractNorm = normalizeText(source.abstract);
  let score = 0;

  for (const rawTerm of queryTerms) {
    const termNorm = normalizeText(rawTerm).trim();
    if (!termNorm) continue;

    const words = termNorm.split(/\s+/).filter((w) => w.length > 2);

    if (titleNorm.includes(termNorm)) {
      score += 100;
    }

    words.forEach((word) => {
      if (titleNorm.includes(word)) score += 25;
    });

    if (abstractNorm.includes(termNorm)) {
      score += 30;
    }

    words.forEach((word) => {
      if (abstractNorm.includes(word)) score += 5;
    });
  }

  return score;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  pt: "pt",
  por: "pt",
  portuguese: "pt",
  português: "pt",
  portugues: "pt",
  en: "en",
  eng: "en",
  english: "en",
  inglês: "en",
  ingles: "en",
  es: "es",
  spa: "es",
  spanish: "es",
  español: "es",
  espanhol: "es",
};

function normalizeLanguageCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_ALIASES[cleaned] ?? (cleaned.length === 2 ? cleaned : null);
}

function buildPrimaryUrl(academicSource: AcademicSource): string {
  if (academicSource.access.openAccessPdfUrl) return academicSource.access.openAccessPdfUrl;
  if (academicSource.doi) return `https://doi.org/${academicSource.doi}`;
  if (academicSource.access.purchaseUrl) return academicSource.access.purchaseUrl;
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(academicSource.title)}`;
}

function describeProviderFailure(providerLabel: string, status: number): string {
  if (status === 429) return `${providerLabel} limitou as requisições (429) — tenta de novo em instantes.`;
  if (status >= 500) return `${providerLabel} está indisponível no momento (${status}).`;
  return `${providerLabel} respondeu ${status}.`;
}

function guessDocumentType(rawType: string | undefined | null): DocumentType {
  const normalizedType = (rawType ?? "").toLowerCase();
  if (normalizedType.includes("book") && !normalizedType.includes("chapter")) return "book";
  if (normalizedType.includes("chapter")) return "chapter";
  if (normalizedType.includes("thesis") || normalizedType.includes("dissertation")) return "thesis";
  if (
    normalizedType.includes("article") ||
    normalizedType.includes("journal") ||
    normalizedType.includes("proceedings")
  )
    return "article";
  return "other";
}

function reconstructAbstract(invertedIndex: Record<string, number[]> | undefined): string | null {
  if (!invertedIndex) return null;
  const wordPositions: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) wordPositions.push([position, word]);
  }
  wordPositions.sort((positionA, positionB) => positionA[0] - positionB[0]);
  const reconstructedText = wordPositions.map(([, word]) => word).join(" ");
  return reconstructedText.length > 0 ? reconstructedText : null;
}

async function fetchOpenAlexWorks(filters: SearchFilters, extraFilterParts: string[]): Promise<any[]> {
  const openAlexParams = new URLSearchParams();
  openAlexParams.set("search", filters.query);
  openAlexParams.set("per_page", "100");
  if (OPENALEX_API_KEY) openAlexParams.set("api_key", OPENALEX_API_KEY);
  if (CONTACT_EMAIL) openAlexParams.set("mailto", CONTACT_EMAIL);
  const dateFilterParts: string[] = [];
  if (filters.yearFrom) dateFilterParts.push(`from_publication_date:${filters.yearFrom}-01-01`);
  if (filters.yearTo) dateFilterParts.push(`to_publication_date:${filters.yearTo}-12-31`);
  const allFilterParts = ["type:article", ...dateFilterParts, ...extraFilterParts];
  if (allFilterParts.length) openAlexParams.set("filter", allFilterParts.join(","));
  const openAlexResponse = await fetchWithTimeout(
    `https://api.openalex.org/works?${openAlexParams.toString()}`
  );
  if (!openAlexResponse.ok) throw new Error(describeProviderFailure("OpenAlex", openAlexResponse.status));
  const openAlexPayload = await openAlexResponse.json();
  return openAlexPayload.results ?? [];
}

function mapOpenAlexWork(openAlexWork: any): AcademicSource {
  const doi = normalizeDoi(openAlexWork.doi);
  const openAccessPdfUrl: string | null =
    openAlexWork.open_access?.oa_url ??
    openAlexWork.best_oa_location?.pdf_url ??
    openAlexWork.primary_location?.pdf_url ??
    null;
  return {
    id: doi ? `doi:${doi}` : `openalex:${openAlexWork.id}`,
    title: openAlexWork.title ?? openAlexWork.display_name ?? "Sem título",
    authors: (openAlexWork.authorships ?? []).map((authorship: any) => ({
      name: authorship.author?.display_name ?? "Autor desconhecido",
    })),
    year: openAlexWork.publication_year ?? null,
    venue:
      openAlexWork.primary_location?.source?.display_name ?? openAlexWork.host_venue?.display_name ?? null,
    documentType: guessDocumentType(openAlexWork.type),
    abstract: reconstructAbstract(openAlexWork.abstract_inverted_index),
    doi,
    citationCount: openAlexWork.cited_by_count ?? null,
    language: normalizeLanguageCode(openAlexWork.language),
    sourceProvider: "openalex",
    access: {
      status: openAlexWork.open_access?.is_oa ? "open" : openAccessPdfUrl ? "open" : "unknown",
      openAccessPdfUrl,
      purchaseUrl: null,
    },
    primaryUrl: "",
  };
}

async function searchOpenAlex(filters: SearchFilters): Promise<AcademicSource[]> {
  const [generalResult, brazilianResult] = await Promise.allSettled([
    fetchOpenAlexWorks(filters, []),
    fetchOpenAlexWorks(filters, ["authorships.countries:BR"]),
  ]);
  if (generalResult.status === "rejected" && brazilianResult.status === "rejected") {
    throw generalResult.reason;
  }
  const generalWorks = generalResult.status === "fulfilled" ? generalResult.value : [];
  const brazilianWorks = brazilianResult.status === "fulfilled" ? brazilianResult.value : [];
  return [...generalWorks, ...brazilianWorks].map(mapOpenAlexWork);
}

async function searchCrossref(filters: SearchFilters): Promise<AcademicSource[]> {
  const crossrefParams = new URLSearchParams();
  crossrefParams.set("query", filters.query);
  crossrefParams.set("rows", "60");
  if (CONTACT_EMAIL) crossrefParams.set("mailto", CONTACT_EMAIL);
  const crossrefResponse = await fetchWithTimeout(
    `https://api.crossref.org/works?${crossrefParams.toString()}`,
    {
      headers: CONTACT_EMAIL ? { "User-Agent": `AcademicHub/1.0 (mailto:${CONTACT_EMAIL})` } : undefined,
    }
  );
  if (!crossrefResponse.ok) throw new Error(describeProviderFailure("Crossref", crossrefResponse.status));
  const crossrefPayload = await crossrefResponse.json();
  return (crossrefPayload.message?.items ?? []).map((crossrefItem: any): AcademicSource => {
    const doi = normalizeDoi(crossrefItem.DOI);
    const publicationYear =
      crossrefItem.published?.["date-parts"]?.[0]?.[0] ??
      crossrefItem["published-print"]?.["date-parts"]?.[0]?.[0] ??
      null;
    return {
      id: doi ? `doi:${doi}` : `crossref:${crossrefItem.DOI ?? Math.random()}`,
      title: Array.isArray(crossrefItem.title) ? (crossrefItem.title[0] ?? "Sem título") : "Sem título",
      authors: (crossrefItem.author ?? []).map((crossrefAuthor: any) => ({
        name: [crossrefAuthor.given, crossrefAuthor.family].filter(Boolean).join(" ") || "Autor desconhecido",
      })),
      year: publicationYear,
      venue: Array.isArray(crossrefItem["container-title"])
        ? (crossrefItem["container-title"][0] ?? null)
        : null,
      documentType: guessDocumentType(crossrefItem.type),
      abstract: crossrefItem.abstract ? String(crossrefItem.abstract).replace(/<\/?jats:[^>]+>/g, "") : null,
      doi,
      citationCount: crossrefItem["is-referenced-by-count"] ?? null,
      language: normalizeLanguageCode(crossrefItem.language),
      sourceProvider: "crossref",
      access: { status: "unknown", openAccessPdfUrl: null, purchaseUrl: crossrefItem.URL ?? null },
      primaryUrl: "",
    };
  });
}

async function searchSemanticScholar(filters: SearchFilters): Promise<AcademicSource[]> {
  const semanticScholarParams = new URLSearchParams();
  semanticScholarParams.set("query", filters.query);
  semanticScholarParams.set("limit", "100");
  semanticScholarParams.set(
    "fields",
    "title,abstract,year,authors,venue,externalIds,openAccessPdf,citationCount,publicationTypes"
  );
  const semanticScholarResponse = await fetchWithTimeout(
    `https://api.semanticscholar.org/graph/v1/paper/search?${semanticScholarParams.toString()}`,
    { headers: SEMANTIC_SCHOLAR_API_KEY ? { "x-api-key": SEMANTIC_SCHOLAR_API_KEY } : undefined }
  );
  if (!semanticScholarResponse.ok)
    throw new Error(describeProviderFailure("Semantic Scholar", semanticScholarResponse.status));
  const semanticScholarPayload = await semanticScholarResponse.json();
  return (semanticScholarPayload.data ?? []).map((semanticScholarPaper: any): AcademicSource => {
    const doi = normalizeDoi(semanticScholarPaper.externalIds?.DOI);
    return {
      id: doi ? `doi:${doi}` : `s2:${semanticScholarPaper.paperId}`,
      title: semanticScholarPaper.title ?? "Sem título",
      authors: (semanticScholarPaper.authors ?? []).map((paperAuthor: any) => ({
        name: paperAuthor.name ?? "Autor desconhecido",
      })),
      year: semanticScholarPaper.year ?? null,
      venue: semanticScholarPaper.venue || null,
      documentType: guessDocumentType((semanticScholarPaper.publicationTypes ?? []).join(" ")),
      abstract: semanticScholarPaper.abstract ?? null,
      doi,
      citationCount: semanticScholarPaper.citationCount ?? null,
      language: null,
      sourceProvider: "semantic_scholar",
      access: {
        status: semanticScholarPaper.openAccessPdf?.url ? "open" : "unknown",
        openAccessPdfUrl: semanticScholarPaper.openAccessPdf?.url ?? null,
        purchaseUrl: null,
      },
      primaryUrl: "",
    };
  });
}

async function fetchDoajArticles(query: string): Promise<any[]> {
  const doajParams = new URLSearchParams();
  doajParams.set("pageSize", "60");
  doajParams.set("page", "1");
  const doajResponse = await fetchWithTimeout(
    `https://doaj.org/api/search/articles/${encodeURIComponent(query)}?${doajParams.toString()}`
  );
  if (!doajResponse.ok) throw new Error(describeProviderFailure("DOAJ", doajResponse.status));
  const doajPayload = await doajResponse.json();
  return doajPayload.results ?? [];
}

function mapDoajArticle(doajArticle: any): AcademicSource {
  const bibjson = doajArticle.bibjson ?? {};
  const identifiers = bibjson.identifier ?? [];
  const doiEntry = identifiers.find((identifier: any) => identifier.type === "doi");
  const doi = normalizeDoi(doiEntry?.id);
  const links = bibjson.link ?? [];
  const fulltextLink = links.find((link: any) => link.type === "fulltext")?.url ?? links[0]?.url ?? null;
  const journalLanguages: string[] = bibjson.journal?.language ?? [];
  return {
    id: doi ? `doi:${doi}` : `doaj:${doajArticle.id}`,
    title: bibjson.title ?? "Sem título",
    authors: (bibjson.author ?? []).map((author: any) => ({ name: author.name ?? "Autor desconhecido" })),
    year: bibjson.year ? Number(bibjson.year) || null : null,
    venue: bibjson.journal?.title ?? null,
    documentType: "article",
    abstract: bibjson.abstract ?? null,
    doi,
    citationCount: null,
    language: normalizeLanguageCode(journalLanguages[0]),
    sourceProvider: "doaj",
    access: {
      status: "open",
      openAccessPdfUrl: fulltextLink,
      purchaseUrl: null,
    },
    primaryUrl: "",
  };
}

async function searchDoaj(filters: SearchFilters): Promise<AcademicSource[]> {
  const [generalResult, brazilianResult] = await Promise.allSettled([
    fetchDoajArticles(filters.query),
    fetchDoajArticles(`(${filters.query}) AND bibjson.journal.country:BR`),
  ]);
  if (generalResult.status === "rejected" && brazilianResult.status === "rejected") {
    throw generalResult.reason;
  }
  const generalArticles = generalResult.status === "fulfilled" ? generalResult.value : [];
  const brazilianArticles = brazilianResult.status === "fulfilled" ? brazilianResult.value : [];
  return [...generalArticles, ...brazilianArticles].map(mapDoajArticle);
}

async function enrichWithUnpaywall(academicSources: AcademicSource[]): Promise<void> {
  const contactEmail = process.env.UNPAYWALL_EMAIL ?? CONTACT_EMAIL;
  if (!contactEmail) return;
  const unpaywallCandidates = academicSources
    .filter((academicSource) => academicSource.doi && academicSource.access.status === "unknown")
    .slice(0, 25);
  await Promise.all(
    unpaywallCandidates.map(async (academicSource) => {
      try {
        const unpaywallResponse = await fetchWithTimeout(
          `https://api.unpaywall.org/v2/${encodeURIComponent(academicSource.doi!)}?email=${encodeURIComponent(contactEmail)}`,
          undefined,
          UNPAYWALL_TIMEOUT_MS
        );
        if (!unpaywallResponse.ok) return;
        const unpaywallPayload = await unpaywallResponse.json();
        const bestOpenAccessUrl: string | null =
          unpaywallPayload.best_oa_location?.url_for_pdf ?? unpaywallPayload.best_oa_location?.url ?? null;
        if (unpaywallPayload.is_oa && bestOpenAccessUrl) {
          academicSource.access.status = "open";
          academicSource.access.openAccessPdfUrl = bestOpenAccessUrl;
        } else if (academicSource.access.status === "unknown") {
          academicSource.access.status = "paywalled";
          academicSource.access.purchaseUrl =
            academicSource.access.purchaseUrl ??
            (academicSource.doi ? `https://doi.org/${academicSource.doi}` : null);
        }
      } catch (err) {
        console.warn("Falha ao enriquecer fonte via Unpaywall", {
          doi: academicSource.doi,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })
  );
}

function dedupeByDoi(academicSources: AcademicSource[]): AcademicSource[] {
  const sourcesByDedupeKey = new Map<string, AcademicSource>();
  for (const academicSource of academicSources) {
    const dedupeKey = academicSource.doi
      ? `doi:${academicSource.doi}`
      : `title:${academicSource.title.trim().toLowerCase().replace(/\s+/g, " ")}:${academicSource.year ?? ""}`;
    const existingSource = sourcesByDedupeKey.get(dedupeKey);
    if (!existingSource) {
      sourcesByDedupeKey.set(dedupeKey, academicSource);
      continue;
    }
    const mergedSource: AcademicSource = {
      ...existingSource,
      abstract: existingSource.abstract ?? academicSource.abstract,
      citationCount: existingSource.citationCount ?? academicSource.citationCount,
      venue: existingSource.venue ?? academicSource.venue,
      language: existingSource.language ?? academicSource.language,
      access: {
        status:
          existingSource.access.status !== "unknown"
            ? existingSource.access.status
            : academicSource.access.status,
        openAccessPdfUrl: existingSource.access.openAccessPdfUrl ?? academicSource.access.openAccessPdfUrl,
        purchaseUrl: existingSource.access.purchaseUrl ?? academicSource.access.purchaseUrl,
      },
    };
    sourcesByDedupeKey.set(dedupeKey, mergedSource);
  }
  return Array.from(sourcesByDedupeKey.values());
}

function applyFilters(academicSources: AcademicSource[], filters: SearchFilters): AcademicSource[] {
  return academicSources.filter((academicSource) => {

    if (isPreprint(academicSource)) return false;

    if (!academicSource.doi) return false;

    if (academicSource.documentType !== "article") return false;

    if (filters.yearFrom && academicSource.year && academicSource.year < filters.yearFrom) return false;
    if (filters.yearTo && academicSource.year && academicSource.year > filters.yearTo) return false;

    if (
      filters.language &&
      !["all", "todos", "qualquer", "any"].includes(filters.language.toLowerCase()) &&
      academicSource.language &&
      academicSource.language !== filters.language
    ) {
      return false;
    }

    if (filters.accessOnly === "open" && academicSource.access.status !== "open") return false;
    return true;
  });
}

type ProviderName = AcademicSource["sourceProvider"];
const MIN_QUERY_LENGTH = 2;
const MAX_QUERIES_PER_REQUEST = 3;
const MAX_RESULTS = 150;

function parseQueryTerms(rawQuery: string | string[] | undefined): string[] {
  const rawValues = Array.isArray(rawQuery) ? rawQuery : [rawQuery ?? ""];
  const terms = rawValues
    .flatMap((value) => value.split(","))
    .map((term) => term.trim().replace(/^["']+|["']+$|^""+|""+$/g, "").trim())
    .filter((term) => term.length >= MIN_QUERY_LENGTH);
  return Array.from(new Set(terms)).slice(0, MAX_QUERIES_PER_REQUEST);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const queryTerms = parseQueryTerms(req.query.query as string | string[] | undefined);
  if (queryTerms.length === 0) {
    res
      .status(400)
      .json({ error: `Informe pelo menos um termo de busca com ${MIN_QUERY_LENGTH}+ caracteres.` });
    return;
  }
  const parsedYearFrom = req.query.yearFrom ? Number(req.query.yearFrom) : undefined;
  const parsedYearTo = req.query.yearTo ? Number(req.query.yearTo) : undefined;
  if (
    (parsedYearFrom !== undefined && Number.isNaN(parsedYearFrom)) ||
    (parsedYearTo !== undefined && Number.isNaN(parsedYearTo))
  ) {
    res.status(400).json({ error: "'yearFrom' e 'yearTo' precisam ser números." });
    return;
  }

  const rawDocumentType = req.query.documentType as string | undefined;
  const rawLanguage = req.query.language as string | undefined;
  const rawAccessOnly = req.query.accessOnly as string | undefined;

  const sharedFilterInput = {
    yearFrom: parsedYearFrom,
    yearTo: parsedYearTo,
    documentType:
      rawDocumentType && !["all", "todos", "any", ""].includes(rawDocumentType.toLowerCase())
        ? (rawDocumentType as SearchFilters["documentType"])
        : undefined,
    language:
      rawLanguage && !["all", "todos", "qualquer", "any", ""].includes(rawLanguage.toLowerCase())
        ? normalizeLanguageCode(rawLanguage) ?? rawLanguage
        : undefined,
    accessOnly:
      rawAccessOnly && rawAccessOnly.toLowerCase() === "open"
        ? ("open" as SearchFilters["accessOnly"])
        : undefined,
  };

  try {
    // Provedores restritos a bases de artigos com revisão por pares
    const providerFactories: Array<[ProviderName, (filters: SearchFilters) => Promise<AcademicSource[]>]> = [
      ["openalex", searchOpenAlex],
      ["crossref", searchCrossref],
      ["semantic_scholar", searchSemanticScholar],
      ["doaj", searchDoaj],
    ];
    const providerSuccessCount: Partial<Record<ProviderName, number>> = {};
    const providerFailureMessage: Partial<Record<ProviderName, string>> = {};
    let mergedSources: AcademicSource[] = [];

    await Promise.all(
      queryTerms.map(async (term) => {
        const termFilters: SearchFilters = { query: term, ...sharedFilterInput };
        const termResults = await Promise.allSettled(
          providerFactories.map(([, runProviderSearch]) => runProviderSearch(termFilters))
        );
        termResults.forEach((termResult, providerIndex) => {
          const [providerName] = providerFactories[providerIndex];
          if (termResult.status === "fulfilled") {
            providerSuccessCount[providerName] = (providerSuccessCount[providerName] ?? 0) + 1;
            mergedSources = mergedSources.concat(termResult.value);
          } else {
            const failureMessage = termResult.reason?.message ?? "Falha desconhecida";
            providerFailureMessage[providerName] = failureMessage;
            console.warn("Provedor de busca acadêmica falhou", {
              provider: providerName,
              term,
              failureMessage,
            });
          }
        });
      })
    );

    const providerErrors: SearchResponse["providerErrors"] = {};
    providerFactories.forEach(([providerName]) => {
      if (!providerSuccessCount[providerName] && providerFailureMessage[providerName]) {
        providerErrors[providerName] = providerFailureMessage[providerName];
      }
    });

    mergedSources = dedupeByDoi(mergedSources);
    await enrichWithUnpaywall(mergedSources);
    mergedSources = applyFilters(mergedSources, { query: queryTerms.join(" "), ...sharedFilterInput });

    // Descarta resultados que não tenham palavras-chave correspondentes
    mergedSources = mergedSources.filter(
      (source) => calculateRelevanceScore(source, queryTerms) > 0
    );

  
    mergedSources.sort((sourceA, sourceB) => {
      const scoreA = calculateRelevanceScore(sourceA, queryTerms);
      const scoreB = calculateRelevanceScore(sourceB, queryTerms);
      if (scoreB !== scoreA) return scoreB - scoreA;

      const brazilScore = (academicSource: AcademicSource) => (academicSource.language === "pt" ? 1 : 0);
      const brazilDiff = brazilScore(sourceB) - brazilScore(sourceA);
      if (brazilDiff !== 0) return brazilDiff;

      const accessScore = (academicSource: AcademicSource) =>
        academicSource.access.status === "open" ? 1 : 0;
      const accessDiff = accessScore(sourceB) - accessScore(sourceA);
      if (accessDiff !== 0) return accessDiff;

      return (sourceB.citationCount ?? 0) - (sourceA.citationCount ?? 0);
    });

    const searchResponse: SearchResponse = {
      results: mergedSources.slice(0, MAX_RESULTS).map((academicSource) => ({
        ...academicSource,
        primaryUrl: buildPrimaryUrl(academicSource),
      })),
      totalEstimate: mergedSources.length,
      providerErrors,
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(searchResponse);
  } catch (err) {
    console.error("Falha inesperada no handler de busca", {
      queryTerms,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: "Erro inesperado ao processar a busca. Tenta de novo em instantes." });
  }
}
