import type { AcademicSource } from "@/features/search/types";
import type { CitationFormat } from "./types";

// Geração de citações é determinística (não depende do modelo de IA):
// os metadados já vêm estruturados dos provedores acadêmicos, então
// formatar é uma questão de regras, não de interpretação.

function splitAuthorName(fullName: string): { firstName: string; lastName: string } {
  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length === 1) return { firstName: "", lastName: nameParts[0] };
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts.slice(0, -1).join(" ");
  return { firstName, lastName };
}

function formatAuthorAbnt(authorName: string): string {
  const { firstName, lastName } = splitAuthorName(authorName);
  return firstName ? `${lastName.toUpperCase()}, ${firstName}` : lastName.toUpperCase();
}

function toApaInitials(firstName: string): string {
  return firstName
    .split(/\s+/)
    .filter(Boolean)
    .map((namePart) => `${namePart[0].toUpperCase()}.`)
    .join(" ");
}

function formatAuthorApa(authorName: string): string {
  const { firstName, lastName } = splitAuthorName(authorName);
  return firstName ? `${lastName}, ${toApaInitials(firstName)}` : lastName;
}

function formatAuthorIeee(authorName: string): string {
  const { firstName, lastName } = splitAuthorName(authorName);
  return firstName ? `${toApaInitials(firstName)} ${lastName}` : lastName;
}

function joinWithConjunction(authorNames: string[], conjunction: string): string {
  if (authorNames.length === 0) return "";
  if (authorNames.length === 1) return authorNames[0];
  return `${authorNames.slice(0, -1).join(", ")} ${conjunction} ${authorNames[authorNames.length - 1]}`;
}

function buildBibtexKey(academicSource: AcademicSource): string {
  // TODO: pode colidir se dois resultados forem do mesmo autor, mesmo ano e
  // a primeira palavra do título coincidir (ex.: dois artigos de "Silva,
  // 2023" que começam com "Uma"). Não vi isso acontecer nos testes que fiz,
  // mas se aparecer, dá pra sufixar com um contador na hora de exportar.
  const firstAuthorLastName = academicSource.authors[0]
    ? splitAuthorName(academicSource.authors[0].name).lastName.replace(/[^a-zA-Z]/g, "")
    : "anon";
  const publicationYear = academicSource.year ?? "s.d.";
  const firstTitleWord = (academicSource.title.split(/\s+/)[0] ?? "obra").replace(/[^a-zA-Z]/g, "");
  return `${firstAuthorLastName}${publicationYear}${firstTitleWord}`.toLowerCase();
}

export function formatCitation(academicSource: AcademicSource, citationFormat: CitationFormat): string {
  const publicationYear = academicSource.year ? String(academicSource.year) : "s.d.";
  const venue = academicSource.venue ?? "";
  const authorNames = academicSource.authors.map((author) => author.name);

  switch (citationFormat) {
    case "abnt": {
      const formattedAuthors = joinWithConjunction(authorNames.map(formatAuthorAbnt), "e");
      const titlePart =
        academicSource.documentType === "book" ? `**${academicSource.title}**` : academicSource.title;
      const venuePart = venue ? ` ${venue},` : "";
      return `${formattedAuthors}. ${titlePart}.${venuePart} ${publicationYear}.`;
    }

    case "apa": {
      const formattedAuthors = joinWithConjunction(authorNames.map(formatAuthorApa), "&");
      const venuePart = venue ? ` ${venue}.` : "";
      return `${formattedAuthors} (${publicationYear}). ${academicSource.title}.${venuePart}`;
    }

    case "ieee": {
      const formattedAuthors = joinWithConjunction(authorNames.map(formatAuthorIeee), "and");
      const venuePart = venue ? `${venue}, ` : "";
      return `${formattedAuthors}, "${academicSource.title}," ${venuePart}${publicationYear}.`;
    }

    case "bibtex": {
      const entryType = academicSource.documentType === "book" ? "book" : "article";
      const bibtexKey = buildBibtexKey(academicSource);
      const authorField = authorNames.join(" and ");
      const bibtexLines = [
        `@${entryType}{${bibtexKey},`,
        `  title = {${academicSource.title}},`,
        `  author = {${authorField}},`,
        `  year = {${publicationYear}},`,
      ];
      if (venue) {
        bibtexLines.push(`  ${entryType === "book" ? "publisher" : "journal"} = {${venue}},`);
      }
      if (academicSource.doi) bibtexLines.push(`  doi = {${academicSource.doi}},`);
      bibtexLines.push("}");
      return bibtexLines.join("\n");
    }
  }
}

export const CITATION_FORMAT_LABELS: Record<CitationFormat, string> = {
  abnt: "ABNT",
  apa: "APA",
  ieee: "IEEE",
  bibtex: "BibTeX",
};
