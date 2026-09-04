import type { DocumentType, SearchFilters } from "../types";

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

const DOCUMENT_TYPES: {
  value: DocumentType;
  label: string;
}[] = [
  { value: "article", label: "Artigo" },
  { value: "book", label: "Livro" },
  { value: "thesis", label: "Tese/dissertação" },
  { value: "chapter", label: "Capítulo" },
];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  function updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    onChange({ ...filters, [key]: value });
  }
  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="lg:sticky lg:top-6 space-y-6">
        <div>
          <p className="text-sm font-medium text-ink mb-2">Ano de publicação</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="De"
              value={filters.yearFrom ?? ""}
              onChange={(e) => updateFilter("yearFrom", e.target.value ? Number(e.target.value) : undefined)}
              className="field-input w-full"
            />
            <span className="text-ink/40 text-sm">–</span>
            <input
              type="number"
              placeholder="Até"
              value={filters.yearTo ?? ""}
              onChange={(e) => updateFilter("yearTo", e.target.value ? Number(e.target.value) : undefined)}
              className="field-input w-full"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">Tipo de documento</p>
          <div className="space-y-1">
            <button
              onClick={() => updateFilter("documentType", undefined)}
              className="drawer-tab block w-full text-left"
              data-active={!filters.documentType ? "true" : "false"}
            >
              Todos
            </button>
            {DOCUMENT_TYPES.map((documentTypeOption) => (
              <button
                key={documentTypeOption.value}
                onClick={() => updateFilter("documentType", documentTypeOption.value)}
                className="drawer-tab block w-full text-left"
                data-active={filters.documentType === documentTypeOption.value ? "true" : "false"}
              >
                {documentTypeOption.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">Disponibilidade</p>
          <div className="space-y-1">
            <button
              onClick={() => updateFilter("accessOnly", undefined)}
              className="drawer-tab block w-full text-left"
              data-active={!filters.accessOnly ? "true" : "false"}
            >
              Aberto e pago
            </button>
            <button
              onClick={() => updateFilter("accessOnly", "open")}
              className="drawer-tab block w-full text-left"
              data-active={filters.accessOnly === "open" ? "true" : "false"}
            >
              Somente acesso aberto
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-2 block" htmlFor="lang-filter">
            Idioma
          </label>
          <select
            id="lang-filter"
            value={filters.language ?? ""}
            onChange={(e) => updateFilter("language", e.target.value || undefined)}
            className="field-input w-full"
          >
            <option value="">Qualquer idioma</option>
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
