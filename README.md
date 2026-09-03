# AcademicHub

Busca e curadoria de fontes acadêmicas (artigos, livros, teses) com detecção
de acesso aberto, justificativa de relevância via IA e exportação de citação
em ABNT/APA/IEEE/BibTeX.

## Rodando localmente

```bash
npm install
cp .env.example .env       # ver tabela de variáveis mais abaixo
npm run dev                # http://localhost:5173
```

`npm run dev` sobe só o frontend. As rotas `/api/*` (busca e relevância) só
respondem via `vercel dev` (precisa da CLI do Vercel instalada e logada:
`npx vercel dev`) ou já implantadas no Vercel — se você só quer mexer em UI
sem tocar nas integrações, `npm run dev` puro já basta e as chamadas a
`/api/search` vão dar 404 mesmo, é esperado.

Antes de logar pela primeira vez, rode as migrações do Supabase, **nesta
ordem**, no SQL Editor do projeto:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_rls.sql`

## Scripts

| Comando                | O que faz                                             |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Vite em modo dev                                      |
| `npm run build`        | `tsc -b` + build de produção                          |
| `npm run preview`      | Serve o build de produção localmente                  |
| `npm run typecheck`    | Só o type-check, sem gerar build                      |
| `npm run lint`         | ESLint (regras em `eslint.config.js`)                 |
| `npm run format`       | Prettier `--write` no projeto inteiro                 |
| `npm run format:check` | Prettier `--check` (usar em CI, não sobrescreve nada) |

## Variáveis de ambiente

| Variável                    | Onde obter                                                                     | Obrigatória?                                        |
| --------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Supabase → Settings → API                                                      | Sim                                                 |
| `VITE_SUPABASE_ANON_KEY`    | Supabase → Settings → API                                                      | Sim                                                 |
| `ANTHROPIC_API_KEY`         | [console.anthropic.com](https://console.anthropic.com)                         | Sim (painel de relevância)                          |
| `OPENALEX_API_KEY`          | [openalex.org](https://openalex.org) → conta gratuita                          | Sim (desde fev/2026)                                |
| `ACADEMICHUB_CONTACT_EMAIL` | seu e-mail                                                                     | Recomendado (libera "polite pool")                  |
| `UNPAYWALL_EMAIL`           | seu e-mail                                                                     | Opcional (usa `ACADEMICHUB_CONTACT_EMAIL` se vazio) |
| `SEMANTIC_SCHOLAR_API_KEY`  | [semanticscholar.org/product/api](https://www.semanticscholar.org/product/api) | Opcional, mas sem isso o rate limit é bem apertado  |
| `GOOGLE_BOOKS_API_KEY`      | Google Cloud Console → ativar "Books API"                                      | Opcional (aumenta cota)                             |

Sem `OPENALEX_API_KEY` ou `ANTHROPIC_API_KEY` configuradas, `npm run build`
funciona normalmente (são só env vars de runtime), mas a busca e o painel de
relevância vão responder com erro em produção. Os outros provedores
degradam bem sozinhos — se só a Semantic Scholar falhar, por exemplo, o
card de resultado ainda aparece com os dados do OpenAlex/Crossref, só sem
aquela fonte específica se ela só existisse lá.

## Estrutura de pastas

```
src/
  features/
    search/       SearchPage, SearchBar, FilterPanel, ResultCard,
                   RelevancePanel, useSearch, types.ts
    collections/  LibraryPage, CollectionSidebar, NoteEditor,
                   SaveToCollectionMenu, useCollections/useSavedSources, types.ts
    citations/    formatCitation (ABNT/APA/IEEE/BibTeX), CitationExporter, types.ts
    auth/         LoginPage, useAuth (link mágico via Supabase)
  shared/
    components/   Layout (o único componente de verdade cross-feature)
    lib/          supabaseClient.ts
    utils/        logger, clipboard, pluralize — helpers pequenos demais
                   pra virar feature própria
api/              Funções serverless (Vercel) — search.ts, relevance.ts
supabase/
  migrations/     Schema + RLS, em ordem de execução
```

Os tipos ficam junto de cada feature (`search/types.ts`,
`collections/types.ts`, `citations/types.ts`) em vez de um `types.ts` único
pra tudo — `collections` e `citations` importam `AcademicSource` de
`search/types` porque uma fonte salva ou citada é sempre, antes de mais
nada, uma fonte que veio da busca.

## Decisões que talvez não sejam óbvias olhando o código

- **Sem backend dedicado.** As integrações acadêmicas (que exigem chaves que
  não podem ir pro navegador) ficam em funções serverless do Vercel — mesmo
  padrão usado num proxy de API do YouTube em outro projeto. Evita manter um
  segundo serviço no ar.
- **Supabase com RLS em vez de API de CRUD própria.** O frontend fala direto
  com o Postgres pra coleções/fontes salvas/notas; `0002_rls.sql` garante
  isolamento por usuário mesmo com a chave `anon` exposta.
- **Dedupe por DOI, não por título.** OpenAlex/Crossref/Semantic Scholar
  retornam a mesma obra com metadados levemente diferentes; DOI normalizado
  é a única chave confiável entre eles (`api/search.ts`).
- **Relevância é sob demanda, nunca em lote.** Gerar justificativa pra ~20
  resultados de uma vez custaria caro e travaria a lista. Só dispara quando
  o usuário clica no item, com cache em memória por sessão.
- **DOAJ como provedor extra, priorizando periódicos brasileiros.** Igual ao
  OpenAlex, faz duas chamadas (geral + `bibjson.journal.country:BR`). DOAJ
  só indexa acesso aberto, então todo resultado de lá já sai com
  `access.status: "open"`.
- **Filtro de idioma é estrito.** Quando `filters.language` está definido,
  qualquer fonte sem idioma normalizado igual é excluída — inclusive as sem
  idioma nenhum (ex.: Semantic Scholar, que não retorna esse dado). Isso
  reduz volume quando o filtro de português está ativo, mas evita mostrar
  fonte em inglês numa busca marcada como "só português".
- **`primaryUrl` sempre aponta pra algum lugar.** PDF aberto → DOI → link de
  compra/leitura → busca no Google Scholar pelo título. O último passo nunca
  falha (é só uma URL de busca), então todo card é clicável mesmo sem link
  direto.
- **Citação é regra, não IA.** Formatar ABNT/APA/IEEE/BibTeX é determinístico
  a partir dos metadados — não tem por que gastar uma chamada de modelo (ou
  arriscar um autor inventado) nisso.

## Known issues / limitações conhecidas

Coisas que sei que faltam e decidi não resolver agora:

- **Multi-termo é limitado a 3 buscas simultâneas e não escala infinitamente.**
  Cada termo dispara os 5 provedores em paralelo; mais que isso e o risco de
  estourar os 10s do plano Hobby do Vercel fica alto demais.
- **Sem confirmação bonita antes de excluir coleção** — é um `window.confirm`
  simples (`CollectionSidebar.tsx`). Funciona, mas destoa do resto da UI.
- **Chave do BibTeX pode colidir** em casos raros (mesmo autor, mesmo ano,
  título começando com a mesma palavra). Não vi acontecer nos testes, mas é
  possível.
- **Semantic Scholar sem `SEMANTIC_SCHOLAR_API_KEY`** cai no pool anônimo
  (100 req/5min) e erra com 429 de vez em quando sob uso mais pesado — o
  card de resultado mostra o erro daquele provedor específico, não derruba
  os outros.
- **Sem dark mode.** A paleta de "papel" do catálogo não converte bem pra
  escuro sem redesenhar (o carimbo vermelho fica estranho); ver comentário
  no topo de `src/index.css`.
- **Cache de justificativa de relevância nunca expira** dentro da sessão
  (`RelevancePanel.tsx`) — improvável de virar problema de memória, mas é
  um `Map` sem teto.

Se for mexer em alguma dessas áreas, vale ler o comentário `TODO`/`HACK` no
arquivo correspondente antes — a maioria tem uma nota explicando por que
ficou assim.
