# LPVCW — Landing Page Vibe Creating WorkFlow

Landing page oficial do projeto **LPVCW — Landing Page Vibe Creating WorkFlow**.

## 🚀 Sobre o Projeto

O LPVCW separa direção visual, implementação e continuidade entre seções, para você criar landing pages completas, coesas e de alto impacto.

### ✨ Características do Design

- **Estética Minimalista & Premium**: Paleta monocromática com iluminação fria e discreta.
- **Workflow Visual em HTML/CSS**: Cinco etapas conectadas através de nós orbitais iluminados com profundidade e perspectiva 3D realista.
- **Zero Dependências**: Construído com HTML5 semântico, CSS puro e fontes locais de alta performance (Plus Jakarta Sans).
- **Responsivo**: Suporte para desktop, tablets e dispositivos móveis (com scroll-snap e enquadramento dinâmico).

## 🛠️ Tecnologias

- HTML5
- CSS3 (Variáveis CSS, CSS 3D Transforms, Backdrop Filter)
- Plus Jakarta Sans

## LPVCW Platform

A plataforma funciona em `/app`; a Landing Page original continua em `/`.
HTML, CSS e módulos JavaScript nativos, sem backend, autenticação ou APIs pagas.
Lucide e Marked estão incluídos localmente, com suas licenças.

### Executar e validar

```bash
npm run dev
npm run lint
npm test
npm run build
```

O servidor local usa a porta 4173. O build gera `dist/`.
Na Vercel, use o repositório existente, framework Other, comando
`npm run build` e saída `dist`. As rewrites em `vercel.json` mantêm
a homepage e permitem acesso direto às rotas internas.

### Funcionalidades

- Dashboard, onboarding de seis etapas e progresso salvo.
- Acervo completo com busca, categorias, favoritos, Markdown, cópia e download.
- Projetos com título, objetivo, público, oferta, anotações e checklist.
- Briefing, montagem de prompts oficiais, planejamento de seções e auditoria manual.
- Temas escuro/claro/sistema, importação validada e exportação de backup.

Os dados são locais ao navegador, sem sincronização entre dispositivos.
Projetos têm salvamento explícito; rascunhos das ferramentas são salvos ao preencher.
O backup inclui projetos, onboarding, favoritos, tema e dados das ferramentas.
Backups inválidos são rejeitados; dados locais corrompidos ficam protegidos para recuperação.

### Materiais oficiais

Importados integralmente da pasta LPVCW do Google Drive em 08/10/2026:

1. LPVCW — Manual rápido.
2. LPVCW — Prompt Universal de Ativação.
3. LPVCW — Correção de Direção Visual Clean - Anti AI-Slop.
4. Prompts Rapidos (20 prompts selecionáveis individualmente).
5. Landing Page Vibe Creating WorkFlow.
6. Estrutura minima de um IP.
7. concept(example).png.

Fontes e datas ficam registradas em `app/materials.json`.
Não existem subpastas na pasta oficial consultada. Os critérios da auditoria
são uma checklist derivada dos fundamentos, com links para os documentos originais.

### Testes de navegador

`tests/browser.mjs` valida a LP, as rotas, onboarding, busca/filtros,
cópia integral, projetos/persistência, ferramentas, backup, exclusão
e overflow no mobile. Requer Playwright e Chromium disponíveis no ambiente.
Com o servidor local em execução:

```bash
node tests/browser.mjs
```

Use `PLAYWRIGHT_MODULE` para um módulo Playwright externo,
`CHROMIUM_PATH` para um executável Chromium e `BASE_URL` para testar
um deploy. Os resultados visuais são gravados em `test-results/`.

### Interface de referência

As abas Início, Projetos, Métodos e Prompts compartilham o shell claro e
a navegação mobile flutuante. `/app/methods` demonstra seis princípios
derivados dos documentos oficiais; `/app/prompts` permite buscar, favoritar,
editar e copiar os 23 prompts completos. A edição é temporária; o montador
reutiliza a versão oficial do prompt e adiciona o contexto escolhido.
A aparência desta versão é clara; a preferência de tema antiga continua no
backup por compatibilidade, sem controlar a nova interface.

`tests/reference-ui.mjs` verifica os novos fluxos e overflow em 360, 390,
430, 768, 1280 e 1440px. Execute com o servidor em execução e as mesmas
variáveis do teste de navegador. `SCREENSHOT_DIR` habilita capturas das quatro abas.
