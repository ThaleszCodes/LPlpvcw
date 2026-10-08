import { createViews } from "./views.js";
import { marked } from "./vendor/marked.js";
import {
  KEY,
  criteria,
  fresh,
  loadState,
  validState,
  progress,
  briefingText,
  planText,
  auditText,
} from "./state.js";
const root = document.querySelector("#root"),
  dialog = document.querySelector("#dialog");
const loaded = loadState();
let state = loaded.data,
  storageBlocked = !!loaded.error,
  materials = [],
  search = "",
  filter = "Todos";
let toastTimer;
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name) => '<i data-lucide="' + name + '" aria-hidden="true"></i>';
const link = (url, text, cls = "") =>
  '<a class="' + cls + '" href="' + url + '">' + text + "</a>";
const button = (action, text, cls = "", extra = "") =>
  '<button class="' +
  cls +
  '" data-action="' +
  action +
  '" ' +
  extra +
  ">" +
  text +
  "</button>";
const field = (name, label, value = "", type = "textarea", hint = "") =>
  '<label class="field"><span>' +
  esc(label) +
  "</span>" +
  (type === "textarea"
    ? '<textarea name="' + name + '">' + esc(value) + "</textarea>"
    : '<input name="' +
      name +
      '" value="' +
      esc(value) +
      '" ' +
      (type === "required" ? 'required maxlength="180"' : "") +
      ">") +
  (hint ? "<small>" + hint + "</small>" : "") +
  "</label>";
const heading = (title, desc = "", actions = "") =>
  '<div class="heading"><div><h1>' +
  title +
  "</h1>" +
  (desc ? '<p class="subtitle">' + desc + "</p>" : "") +
  "</div>" +
  actions +
  "</div>";
const bar = (p) =>
  '<div class="progress" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
  p +
  '"><span style="width:' +
  p +
  '%"></span></div>';
const short = (m) =>
  ({
    manual: "O fluxo completo, explicado de forma direta.",
    ativacao: "Ative o orquestrador e preserve todas as regras oficiais.",
    "direcao-clean": "Redução visual, hierarquia e baixa entropia.",
    "prompts-rapidos": "20 comandos para cada etapa do workflow.",
    workflow: "Fundamentos e sequência da metodologia.",
    "implementation-prompt": "Estrutura mínima para implementar uma seção.",
  })[m.slug] || "Referência visual oficial.";
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 4000);
}
function save() {
  if (storageBlocked) {
    toast(
      "Dados locais protegidos. Exporte a recuperação e importe um backup válido nas preferências.",
    );
    return false;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    toast(
      "Não foi possível salvar neste dispositivo. Exporte seus dados nas preferências.",
    );
    return false;
  }
}
function syncNav() {
  const sidebar = document.querySelector("#sidebar");
  if (!sidebar) return;
  const hidden =
    matchMedia("(max-width:720px)").matches &&
    !sidebar.classList.contains("open");
  sidebar.inert = hidden;
  sidebar.setAttribute("aria-hidden", String(hidden));
}
function theme() {
  document.documentElement.dataset.theme = "light";
}
function go(path) {
  history.pushState({}, "", path);
  search = "";
  filter = "Todos";
  render();
  window.scrollTo(0, 0);
  document.querySelector("h1")?.focus({ preventScroll: true });
}
function route() {
  return location.pathname.replace(/\/$/, "").split("/").slice(2);
}
const nav = [
  ["", "Início", "house"],
  ["projects", "Projetos", "folder"],
  ["methods", "Métodos", "book-open"],
  ["prompts", "Prompts", "layers"],
];
const views = createViews({
  esc,
  icon,
  link,
  button,
  heading,
  progress,
  criteria,
  promptOptions,
  getState: () => state,
  getMaterials: () => materials,
});
function shell(content) {
  const [page] = route();
  const active = page || "";
  const previousNav = Number(
    document.querySelector(".mobile-nav")?.dataset.active || 0,
  );
  const activeNav = Math.max(
    0,
    nav.findIndex(([p]) => p === active),
  );
  const brand =
    '<span class="brand-mark">L</span><span>LPVCW<small>PLATFORM</small></span>';
  const items = nav
    .map(
      ([p, t, i]) =>
        '<a href="/app' +
        (p ? "/" + p : "") +
        '" ' +
        (active === p ? 'aria-current="page"' : "") +
        ">" +
        icon(i) +
        "<span>" +
        t +
        "</span></a>",
    )
    .join("");
  root.innerHTML =
    '<aside class="sidebar" id="sidebar">' +
    link("/app", brand, "brand") +
    '<nav aria-label="Navegação principal">' +
    items +
    "</nav><footer>" +
    link("/app/onboarding", icon("circle-help") + "Ajuda") +
    link("/app/library", icon("archive") + "Acervo oficial") +
    link("/app/tools", icon("sliders-horizontal") + "Ferramentas") +
    link("/app/settings", icon("settings-2") + "Preferências") +
    '<small>Dados neste dispositivo · sem sincronização</small></footer></aside><div class="workspace"><header class="topbar">' +
    link("/app", brand, "brand mobile-brand") +
    '<span class="crumb">Workspace / <b>' +
    (nav.find(([p]) => p === active)?.[1] || "LPVCW") +
    "</b></span>" +
    '<a href="/app/settings" class="profile" aria-label="Abrir preferências">' +
    icon("user-round") +
    "</a>" +
    '</header><main id="main">' +
    content +
    '</main></div><nav class="mobile-nav" data-active="' +
    activeNav +
    '" aria-label="Navegação mobile"><span class="nav-indicator" aria-hidden="true" style="transform:translateX(' +
    activeNav * 100 +
    '%)"></span>' +
    items +
    "</nav>";
  document.querySelector("h1")?.setAttribute("tabindex", "-1");
  window.lucide?.createIcons();
  theme();
  syncNav();
  if (!matchMedia("(prefers-reduced-motion:reduce)").matches)
    document
      .querySelector(".nav-indicator")
      ?.animate(
        [
          { transform: "translateX(" + previousNav * 100 + "%)" },
          { transform: "translateX(" + activeNav * 100 + "%)" },
        ],
        { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" },
      );
}
const materialRow = (m) =>
  '<a class="library-row" href="/app/library/' +
  m.slug +
  '">' +
  icon(
    m.category === "Prompt"
      ? "square-terminal"
      : m.category === "Referência"
        ? "image"
        : "file-text",
  ) +
  "<div><h3>" +
  esc(m.title) +
  "</h3><p>" +
  short(m) +
  '</p></div><span class="meta">' +
  m.category +
  "</span></a>";
function dashboard() {
  return views.home();
}

const steps = [
  [
    "Primeiro a direção. Depois o código.",
    "LPVCW significa Landing Page Vibe Creating WorkFlow. A metodologia separa design e implementação para construir uma Landing Page uma seção por vez.",
    "A imagem define. O humano aprova. A IA de texto traduz. A IA de código implementa.",
    "workflow",
  ],
  [
    "O briefing alimenta as decisões.",
    "Reúna marca, produto, público, objetivo, oferta, CTA, identidade, referências e assets. Use o Prompt Universal de Ativação na sua IA de texto para conduzir o fluxo.",
    "Contexto claro antes de qualquer geração visual.",
    "ativacao",
  ],
  [
    "O Hero define o DNA visual.",
    "Crie um Concept-Hero de alta fidelidade. Revise composição, hierarquia, tipografia e personalidade. Aprove a direção antes de extrair o background puro.",
    "Concept-Hero → aprovação → Hero BG → Implementation Prompt → código.",
    "manual",
  ],
  [
    "Cada seção passa pelo visual.",
    "Nas próximas seções, produza uma Reference Visual (RV), aprove a composição e prepare o BG. Com os assets disponíveis, gere o IP para a IA de código.",
    "RV → aprovação → BG → IP → implementação.",
    "implementation-prompt",
  ],
  [
    "Continuidade sem repetição.",
    "Conecte as dobras por cor, iluminação, fundo e ritmo. Preserve a identidade, mas varie a macrocomposição. No mobile, recomponha em vez de apenas encolher.",
    "Identidade não é template. Espaço vazio é um elemento de design válido.",
    "direcao-clean",
  ],
  [
    "Aplique no seu projeto.",
    "O acervo preserva os textos oficiais completos. Copie os prompts, troque os campos entre colchetes e acrescente seu contexto. Use Projetos para registrar decisões e Ferramentas para organizar a aplicação.",
    "Os dados ficam neste dispositivo e não são sincronizados entre aparelhos. Faça backups nas preferências.",
    "prompts-rapidos",
  ],
];
function onboarding() {
  const s = steps[state.onboarding.step];
  const chapterIcons = [
    "layers",
    "file-pen-line",
    "layout-template",
    "panels-top-left",
    "workflow",
    "folder-check",
  ];
  return (
    '<div class="onboarding"><div class="onboarding-header"><div class="eyebrow">Introdução ao LPVCW</div><p class="step-number">' +
    String(state.onboarding.step + 1).padStart(2, "0") +
    ' / 06</p></div><div class="steps" aria-label="Etapa ' +
    (state.onboarding.step + 1) +
    ' de 6">' +
    steps
      .map(
        (_, i) =>
          '<span class="' +
          (i <= state.onboarding.step ? "done" : "") +
          '"></span>',
      )
      .join("") +
    '</div><div class="onboarding-stage"><div class="onboarding-content"><div class="chapter-icon">' +
    icon(chapterIcons[state.onboarding.step]) +
    "</div><h1>" +
    s[0] +
    '</h1><p class="explanation">' +
    s[1] +
    '</p><div class="step-example"><p>' +
    s[2] +
    "</p></div>" +
    link("/app/library/" + s[3], "Consultar material oficial", "text-link") +
    '</div><div class="step-footer">' +
    button(
      "step-back",
      "Voltar",
      "",
      "" + (!state.onboarding.step ? "disabled" : ""),
    ) +
    '<div class="actions">' +
    button(
      "step-next",
      state.onboarding.step === 5 ? "Concluir introdução" : "Continuar",
      "primary",
    ) +
    '</div></div></div><div class="onboarding-footer">' +
    button("skip", "Pular por enquanto", "ghost") +
    "</div></div>"
  );
}
function animateEntry(direction = 0) {
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const [page] = route();
  const surface = document.querySelector(
    page === "onboarding" ? ".onboarding-content" : "#main",
  );
  if (!surface?.animate) return;
  const from =
    page === "onboarding"
      ? "translateX(" + (direction < 0 ? -10 : 10) + "px)"
      : "translateY(6px)";
  surface.animate(
    [
      { opacity: 0, transform: from },
      { opacity: 1, transform: "none" },
    ],
    {
      duration: page === "onboarding" ? 280 : 240,
      easing: "cubic-bezier(.22,1,.36,1)",
    },
  );
}
function moveOnboarding(direction) {
  const before = document.querySelector(".onboarding-content");
  const snapshot = before?.cloneNode(true);
  const height = before?.getBoundingClientRect().height;
  state.onboarding.step = Math.max(
    0,
    Math.min(5, state.onboarding.step + direction),
  );
  save();
  render(direction);
  const after = document.querySelector(".onboarding-content");
  if (
    snapshot &&
    after &&
    !matchMedia("(prefers-reduced-motion:reduce)").matches
  ) {
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.inert = true;
    snapshot.classList.add("outgoing-step");
    snapshot.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    snapshot.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;inset:38px 42px auto;pointer-events:none;";
    if (matchMedia("(max-width:1100px)").matches)
      overlay.style.cssText =
        "position:absolute;inset:32px 32px auto;pointer-events:none;";
    if (matchMedia("(max-width:720px)").matches)
      overlay.style.cssText =
        "position:absolute;inset:26px 22px auto;pointer-events:none;";
    overlay.append(snapshot);
    after.parentElement.append(overlay);
    snapshot
      .animate(
        [
          { opacity: 0.5, transform: "none" },
          {
            opacity: 0,
            transform: "translateX(" + (direction < 0 ? 10 : -10) + "px)",
          },
        ],
        { duration: 180, easing: "ease-out" },
      )
      .finished.finally(() => overlay.remove());
    const target = after.getBoundingClientRect().height;
    if (Math.abs(target - height) > 1)
      after.animate([{ height: height + "px" }, { height: target + "px" }], {
        duration: 280,
        easing: "cubic-bezier(.22,1,.36,1)",
      });
  }
  document.querySelector(".onboarding h1")?.focus({ preventScroll: true });
}
function library() {
  return (
    heading(
      "Acervo oficial",
      "Documentos originais da metodologia. Consulte, copie e aplique.",
    ) +
    '<div class="searchbar"><label class="search">' +
    icon("search") +
    '<input id="search" aria-label="Buscar no acervo" placeholder="Buscar materiais, conceitos ou prompts…" value="' +
    esc(search) +
    '"></label><select id="filter" aria-label="Filtrar por categoria">' +
    ["Todos", "Guia", "Prompt", "Referência", "Favoritos"]
      .map(
        (c) =>
          "<option " + (filter === c ? "selected" : "") + ">" + c + "</option>",
      )
      .join("") +
    '</select></div><div id="library-results">' +
    libraryResults() +
    "</div>"
  );
}
function libraryResults() {
  const result = materials.filter(
    (m) =>
      (filter === "Todos" ||
        filter === m.category ||
        (filter === "Favoritos" && state.favorites.includes(m.slug))) &&
      normalize(m.title + " " + m.content).includes(normalize(search)),
  );
  return (
    '<p class="library-count">' +
    result.length +
    " " +
    (result.length === 1 ? "material" : "materiais") +
    "</p>" +
    (result.length
      ? result.map(materialRow).join("")
      : '<div class="empty"><h3>Nenhum material encontrado.</h3><p>Tente outro termo ou escolha uma categoria diferente.</p></div>')
  );
}
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function safeMarkdown(text) {
  const doc = new DOMParser().parseFromString(marked.parse(text), "text/html");
  doc
    .querySelectorAll("script,iframe,object,embed,style,form,input")
    .forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const a of [...el.attributes])
      if (
        a.name.startsWith("on") ||
        a.name === "style" ||
        (["href", "src"].includes(a.name) && !/^(https?:|\/|#)/i.test(a.value))
      )
        el.removeAttribute(a.name);
  });
  return doc.body.innerHTML;
}
function materialPage(slug) {
  const m = materials.find((m) => m.slug === slug);
  if (!m) return notFound();
  return (
    link("/app/library", icon("chevron-left") + "Acervo", "back") +
    heading(esc(m.title), short(m)) +
    '<p class="meta">Fonte: pasta LPVCW · ' +
    (m.updated
      ? "Atualizado em " +
        new Date(m.updated).toLocaleDateString("pt-BR") +
        " · "
      : "") +
    'Texto original preservado</p><div class="reader-tools">' +
    (m.category !== "Referência"
      ? button(
          "copy-material",
          icon("copy") + "Copiar conteúdo",
          "",
          'data-slug="' + m.slug + '"',
        )
      : "") +
    button(
      "favorite",
      icon("bookmark") + (state.favorites.includes(slug) ? "Salvo" : "Salvar"),
      "",
      'data-slug="' +
        slug +
        '" aria-pressed="' +
        state.favorites.includes(slug) +
        '"',
    ) +
    button(
      "download-material",
      icon("download") + "Baixar",
      "",
      'data-slug="' + slug + '"',
    ) +
    link(m.source, "Abrir original", "button ghost") +
    '</div><article class="document">' +
    (m.category === "Referência"
      ? '<img class="concept" src="/app/concept.png" alt="Concept-Hero de exemplo oficial do LPVCW">'
      : safeMarkdown(m.content)) +
    "</article>"
  );
}
function checkList(checked, scope) {
  return (
    '<div class="checklist">' +
    criteria
      .map(
        ([title, desc, source], i) =>
          '<div><label class="check"><input type="checkbox" data-check="' +
          scope +
          '" value="' +
          i +
          '" ' +
          (checked.includes(i) ? "checked" : "") +
          "><span>" +
          title +
          "<small>" +
          desc +
          "</small></span></label>" +
          (scope === "audit"
            ? '<div style="margin:0 0 14px 31px">' +
              link(
                "/app/library/" + source,
                "Consultar fundamento",
                "text-link",
              ) +
              "</div>"
            : "") +
          "</div>",
      )
      .join("") +
    "</div>"
  );
}
function projects() {
  return views.projects();
}
function projectEditor(id) {
  const p =
    id === "new"
      ? {
          title: "",
          objective: "",
          audience: "",
          offer: "",
          notes: "",
          checks: [],
        }
      : state.projects.find((p) => p.id === id);
  if (!p) return notFound();
  return (
    link("/app/projects", icon("chevron-left") + "Projetos", "back") +
    heading(
      id === "new" ? "Novo projeto" : esc(p.title),
      "Salve o contexto e marque apenas as etapas que já concluiu.",
    ) +
    '<form id="project-form" class="editor" data-id="' +
    id +
    '"><div class="form-grid"><div class="wide">' +
    field("title", "Título do projeto", p.title, "required") +
    "</div>" +
    field("objective", "Objetivo da página", p.objective) +
    field("audience", "Público-alvo", p.audience) +
    '<div class="wide">' +
    field("offer", "Oferta", p.offer) +
    '</div><div class="wide">' +
    field("notes", "Anotações e decisões", p.notes) +
    '</div></div><div class="section-head" style="margin-top:36px"><h2>Checklist de aplicação</h2><span id="project-progress" class="meta">' +
    progress(p.checks) +
    "% concluído</span></div>" +
    checkList(p.checks, "project") +
    '<div class="form-actions"><span class="meta">Dados locais · sem sincronização</span><button class="primary" type="submit">' +
    icon("check") +
    "Salvar projeto</button></div></form>"
  );
}
const toolDefs = [
  {
    id: "briefing",
    title: "Gerador de briefing",
    desc: "Organize marca, oferta e direção em um documento pronto para usar.",
    icon: "file-pen-line",
  },
  {
    id: "composer",
    title: "Montador de prompts",
    desc: "Combine as instruções oficiais com o contexto do seu projeto.",
    icon: "square-terminal",
  },
  {
    id: "sections",
    title: "Planejador de seções",
    desc: "Defina a sequência, o objetivo e as observações de cada dobra.",
    icon: "list-ordered",
  },
  {
    id: "audit",
    title: "Checklist de auditoria",
    desc: "Revise critérios da metodologia e registre o que já foi verificado.",
    icon: "list-checks",
  },
];
function toolsHome() {
  return (
    heading(
      "Ferramentas",
      "Prepare o contexto e organize sua aplicação do LPVCW.",
    ) +
    '<div class="tool-grid">' +
    toolDefs
      .map(
        (t) =>
          '<a class="tool-tile" href="/app/tools/' +
          t.id +
          '">' +
          icon(t.icon) +
          "<h2>" +
          t.title +
          "</h2><p>" +
          t.desc +
          '</p><span class="text-link">Abrir ferramenta</span></a>',
      )
      .join("") +
    "</div>"
  );
}
const briefLabels = [
  "Marca / projeto",
  "Produto ou serviço",
  "Público-alvo",
  "Objetivo da página",
  "Oferta",
  "CTA principal",
  "Identidade visual",
  "Referências e assets",
  "Restrições",
];
function briefing() {
  return (
    '<form id="brief-form" class="editor"><div class="form-grid">' +
    briefLabels
      .map(
        (l, i) =>
          '<div class="' +
          (i === 8 ? "wide" : "") +
          '">' +
          field(
            "b" + i,
            l,
            state.brief[l] || "",
            i === 0 ? "required" : "textarea",
          ) +
          "</div>",
      )
      .join("") +
    '</div><div class="form-actions"><span class="meta">Rascunho salvo ao preencher</span><button class="primary" type="submit">Gerar briefing</button></div></form><div id="result"></div>'
  );
}
function promptOptions() {
  const opts = [];
  materials
    .filter((m) => m.category === "Prompt")
    .forEach((m) => {
      if (m.slug === "prompts-rapidos") {
        const re =
          /# (\d+)\. ([^\n]+)\n([\s\S]*?)(?=\n# \d+\.|\n# Cheat Sheet|$)/g;
        for (const match of m.content.matchAll(re)) {
          const block = match[3].match(
            /\x60\x60\x60text\n([\s\S]*?)\n\x60\x60\x60/,
          );
          if (block)
            opts.push({
              id: m.slug + ":" + match[1],
              title: match[1] + ". " + match[2],
              content: block[1],
              slug: m.slug,
            });
        }
      } else
        opts.push({
          id: m.slug,
          title: m.title,
          content: m.content,
          slug: m.slug,
        });
    });
  return opts;
}
function composer() {
  const options = promptOptions();
  return (
    '<form id="composer-form" class="editor"><label class="field"><span>Prompt oficial</span><select name="prompt" style="max-width:none">' +
    options
      .map(
        (p) =>
          '<option value="' +
          p.id +
          '" ' +
          (state.composer.prompt === p.id ? "selected" : "") +
          ">" +
          esc(p.title) +
          "</option>",
      )
      .join("") +
    '</select></label><label class="field" style="margin:24px 0"><span>Usar contexto de um projeto</span><select name="project" style="max-width:none"><option value="">Nenhum projeto</option>' +
    state.projects
      .map(
        (p) =>
          '<option value="' +
          p.id +
          '" ' +
          (state.composer.project === p.id ? "selected" : "") +
          ">" +
          esc(p.title) +
          "</option>",
      )
      .join("") +
    "</select></label>" +
    field(
      "context",
      "Contexto adicional",
      state.composer.context,
      "textarea",
      "Preencha as informações necessárias e revise os campos entre colchetes antes de usar.",
    ) +
    '<div class="form-actions"><span class="meta">Instruções oficiais preservadas integralmente</span><button class="primary" type="submit">Montar prompt</button></div></form><div id="result"></div>'
  );
}
function sections() {
  return (
    '<p class="subtitle">Ordene a narrativa da página. As seções não precisam repetir a mesma composição.</p><div id="section-list">' +
    sectionList() +
    '</div><div class="actions">' +
    button("add-section", icon("plus") + "Adicionar seção") +
    button(
      "copy-plan",
      icon("copy") + "Copiar planejamento",
      "primary",
      "" + (!state.sections.length ? "disabled" : ""),
    ) +
    "</div>"
  );
}
function sectionList() {
  return state.sections.length
    ? state.sections
        .map(
          (s, i) =>
            '<section class="section-editor" data-section="' +
            s.id +
            '"><span class="index">' +
            String(i + 1).padStart(2, "0") +
            '</span><div class="fields">' +
            field("title", "Nome da seção", s.title, "input") +
            field("objective", "Objetivo", s.objective) +
            field("notes", "Observações / assets / continuidade", s.notes) +
            '</div><div class="controls">' +
            button(
              "move-section",
              icon("chevron-up"),
              "icon-button",
              'data-id="' +
                s.id +
                '" data-direction="-1" aria-label="Mover seção para cima" ' +
                (!i ? "disabled" : ""),
            ) +
            button(
              "move-section",
              icon("chevron-down"),
              "icon-button",
              'data-id="' +
                s.id +
                '" data-direction="1" aria-label="Mover seção para baixo" ' +
                (i === state.sections.length - 1 ? "disabled" : ""),
            ) +
            button(
              "remove-section",
              icon("trash-2"),
              "icon-button",
              'data-id="' + s.id + '" aria-label="Remover seção"',
            ) +
            "</div></section>",
        )
        .join("")
    : '<div class="empty"><h3>Planeje a primeira dobra.</h3><p>Adicione o Hero e organize as próximas seções conforme o objetivo da página.</p></div>';
}
function audit() {
  const p = progress(state.audit);
  return (
    '<p class="subtitle">Revisão manual baseada nos documentos oficiais. Marque somente os critérios verificados.</p><div class="section-head"><h2>Qualidade da aplicação</h2><span id="audit-progress" class="meta">' +
    p +
    '% concluído</span></div><div id="audit-bar">' +
    bar(p) +
    "</div>" +
    checkList(state.audit, "audit") +
    '<div class="actions">' +
    button("copy-audit", icon("copy") + "Copiar relatório", "primary") +
    button("export-audit", icon("download") + "Exportar .txt") +
    button("reset-audit", "Reiniciar", "ghost") +
    "</div>"
  );
}
function toolPage(id) {
  const t = toolDefs.find((t) => t.id === id);
  if (!t) return notFound();
  return (
    link("/app/tools", icon("chevron-left") + "Ferramentas", "back") +
    heading(t.title, t.desc) +
    { briefing, composer, sections, audit }[id]()
  );
}
function settings() {
  return (
    heading(
      "Preferências",
      "Seus dados ficam neste navegador. Não há conta ou sincronização entre aparelhos.",
    ) +
    '<div class="setting"><div><h3>Seu espaço de trabalho</h3><p>Acesse os materiais, ferramentas e introdução.</p></div><div class="actions">' +
    link("/app/library", "Acervo oficial", "button") +
    link("/app/tools", "Ferramentas", "button") +
    link("/app/onboarding", "Ajuda", "button") +
    "</div></div>" +
    '<div class="setting"><div><h3>Aparência</h3><p>Interface clara em preto, branco e cinzas neutros.</p></div></div><div class="setting"><div><h3>Introdução</h3><p>Recomece o onboarding. Seus projetos permanecem salvos.</p></div>' +
    button("reset-onboarding", "Reiniciar introdução") +
    '</div><div class="setting"><div><h3>Backup dos dados locais</h3><p>Exporte projetos, favoritos e rascunhos. Guarde o arquivo para restaurar em outro dispositivo.</p></div>' +
    button("export", icon("download") + "Exportar backup") +
    '</div><div class="setting"><div><h3>Restaurar backup</h3><p>A importação substitui os dados locais atuais após confirmação. Apenas backups válidos são aceitos.</p></div>' +
    button("import", icon("upload") + "Importar backup") +
    '<input hidden style="display:none" type="file" id="backup-file" accept=".json,application/json"></div><div class="setting"><div><h3>LPVCW Platform 1.0</h3><p>Plataforma gratuita. Acervo importado da pasta oficial LPVCW em 08/10/2026. As datas dos documentos estão disponíveis nas páginas individuais.</p></div>' +
    link("/app/library", "Consultar acervo", "text-link") +
    "</div>"
  );
}
function notFound() {
  return (
    heading(
      "Página não encontrada",
      "O endereço não corresponde a um material ou projeto disponível.",
    ) + link("/app", "Voltar ao início", "button")
  );
}
function render(direction = 0) {
  const [page, id] = route();
  let content;
  if (!page) content = dashboard();
  else if (page === "methods") content = views.methods();
  else if (page === "prompts") content = views.prompts();
  else if (page === "onboarding") content = onboarding();
  else if (page === "library") content = id ? materialPage(id) : library();
  else if (page === "projects") content = id ? projectEditor(id) : projects();
  else if (page === "tools") content = id ? toolPage(id) : toolsHome();
  else if (page === "settings") content = settings();
  else content = notFound();
  shell(content);
  animateEntry(direction);
  document.querySelectorAll(".document pre").forEach((pre) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "Copiar trecho";
    b.addEventListener("click", () =>
      copy(pre.querySelector("code")?.textContent || ""),
    );
    pre.prepend(b);
  });
}
async function copy(text, feedback = "Copiado para a área de transferência.") {
  try {
    await navigator.clipboard.writeText(text);
    toast(feedback);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (ok) toast(feedback);
    else {
      dialog.innerHTML =
        '<h2>Cópia manual</h2><p>O navegador bloqueou a cópia. Selecione o texto abaixo e use a opção copiar do seu dispositivo.</p><textarea aria-label="Texto para copiar manualmente" class="manual-copy"></textarea><button id="close-copy">Fechar</button>';
      dialog.querySelector("textarea").value = text;
      dialog.showModal();
      dialog.querySelector("textarea").select();
      dialog.querySelector("#close-copy").onclick = () => dialog.close();
    }
  }
}
function download(text, name, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function confirmAction(title, desc, action) {
  dialog.setAttribute("aria-labelledby", "dialog-title");
  dialog.innerHTML =
    '<h2 id="dialog-title">' +
    esc(title) +
    "</h2><p>" +
    esc(desc) +
    '</p><div class="actions"><button id="cancel-dialog">Cancelar</button><button class="primary" id="confirm-dialog">Confirmar</button></div>';
  dialog.showModal();
  dialog.querySelector("#cancel-dialog").onclick = () => dialog.close();
  dialog.querySelector("#confirm-dialog").onclick = () => {
    dialog.close();
    action();
  };
}
function showResult(text, title) {
  const el = document.querySelector("#result");
  el.innerHTML =
    '<section class="result"><div class="section-head"><h2>' +
    title +
    '</h2><button id="copy-result">' +
    icon("copy") +
    'Copiar resultado</button></div><pre class="output" tabindex="0"></pre></section>';
  el.querySelector("pre").textContent = text;
  el.querySelector("button").onclick = () => copy(text);
  window.lucide?.createIcons();
  el.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
}
function handleClick(e) {
  const a = e.target.closest("a");
  if (
    a &&
    a.getAttribute("href")?.startsWith("/app") &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.shiftKey
  ) {
    e.preventDefault();
    go(a.getAttribute("href"));
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const { action, slug, id } = b.dataset;
  if (views.handle(action, b, { render, save, copy, toast, go, dialog, state }))
    return;
  const m = materials.find((m) => m.slug === slug);
  if (action === "menu") {
    const open = document.querySelector("#sidebar").classList.toggle("open");
    b.setAttribute("aria-expanded", open);
    syncNav();
  }
  if (action === "copy-material" && m) copy(m.content);
  if (action === "download-material" && m) {
    if (m.category === "Referência") {
      const a = document.createElement("a");
      a.href = "/app/concept.png";
      a.download = "concept-example.png";
      a.click();
    } else download(m.content, m.slug + ".md", "text/markdown");
  }
  if (action === "favorite") {
    state.favorites = state.favorites.includes(slug)
      ? state.favorites.filter((s) => s !== slug)
      : [...state.favorites, slug];
    save();
    render();
  }
  if (action === "step-back") {
    moveOnboarding(-1);
  }
  if (action === "step-next") {
    if (state.onboarding.step < 5) {
      moveOnboarding(1);
    } else {
      state.onboarding.completed = true;
      save();
      go("/app");
      toast("Introdução concluída. Seu projeto pode começar.");
    }
  }
  if (action === "skip") go("/app");
  if (action === "delete-project")
    confirmAction(
      "Excluir projeto?",
      "Esta ação remove o projeto deste dispositivo.",
      () => {
        state.projects = state.projects.filter((p) => p.id !== id);
        save();
        render();
        toast("Projeto excluído.");
      },
    );
  if (action === "add-section") {
    if (state.sections.length >= 200) {
      toast("Limite de 200 seções atingido.");
      return;
    }
    state.sections.push({
      id: crypto.randomUUID(),
      title: state.sections.length ? "" : "Hero",
      objective: "",
      notes: "",
    });
    save();
    render();
  }
  if (action === "move-section") {
    const i = state.sections.findIndex((s) => s.id === id),
      j = i + Number(b.dataset.direction);
    if (j >= 0 && j < state.sections.length) {
      [state.sections[i], state.sections[j]] = [
        state.sections[j],
        state.sections[i],
      ];
      save();
      render();
    }
  }
  if (action === "remove-section")
    confirmAction(
      "Remover seção?",
      "O conteúdo desta seção será removido do planejamento.",
      () => {
        state.sections = state.sections.filter((s) => s.id !== id);
        save();
        render();
      },
    );
  if (action === "copy-plan") copy(planText(state.sections));
  if (action === "copy-audit") copy(auditText(state.audit));
  if (action === "export-audit")
    download(auditText(state.audit), "auditoria-lpvcw.txt");
  if (action === "reset-audit")
    confirmAction(
      "Reiniciar auditoria?",
      "Todos os critérios ficarão desmarcados.",
      () => {
        state.audit = [];
        save();
        render();
      },
    );
  if (action === "reset-onboarding") {
    state.onboarding = { step: 0, completed: false };
    save();
    go("/app/onboarding");
  }
  if (action === "export") {
    const raw = storageBlocked
      ? localStorage.getItem(KEY)
      : JSON.stringify(state, null, 2);
    download(
      raw || JSON.stringify(state),
      "lpvcw-backup-" + new Date().toISOString().slice(0, 10) + ".json",
      "application/json",
    );
    toast("Backup exportado.");
  }
  if (action === "import") document.querySelector("#backup-file").click();
}
root.addEventListener("click", handleClick);
dialog.addEventListener("click", handleClick);
dialog.addEventListener("input", (e) => views.input(e.target));
root.addEventListener("input", (e) => {
  const t = e.target;
  if (views.input(t)) return;
  if (t.id === "search") {
    search = t.value;
    document.querySelector("#library-results").innerHTML = libraryResults();
    window.lucide?.createIcons();
  }
  if (t.closest("#brief-form")) {
    const values = Object.fromEntries(new FormData(t.closest("form")));
    state.brief = Object.fromEntries(
      briefLabels.map((l, i) => [l, values["b" + i] || ""]),
    );
    save();
  }
  if (t.closest("#composer-form")) {
    state.composer = Object.fromEntries(new FormData(t.closest("form")));
    save();
  }
  const section = t.closest("[data-section]");
  if (section) {
    const s = state.sections.find((s) => s.id === section.dataset.section);
    s[t.name] = t.value;
    save();
  }
});
root.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.id === "filter") {
    filter = t.value;
    document.querySelector("#library-results").innerHTML = libraryResults();
    window.lucide?.createIcons();
  }
  if (t.id === "theme") {
    state.theme = t.value;
    save();
    theme();
  }
  if (t.dataset.check === "audit") {
    const n = Number(t.value);
    state.audit = t.checked
      ? [...state.audit, n]
      : state.audit.filter((i) => i !== n);
    save();
    document.querySelector("#audit-progress").textContent =
      progress(state.audit) + "% concluído";
    document.querySelector("#audit-bar").innerHTML = bar(progress(state.audit));
  }
  if (t.dataset.check === "project") {
    const checks = [
      ...document.querySelectorAll("[data-check=project]:checked"),
    ].map((i) => Number(i.value));
    document.querySelector("#project-progress").textContent =
      progress(checks) + "% concluído";
  }
  if (t.id === "backup-file" && t.files[0]) {
    try {
      const f = t.files[0];
      if (f.size > 5e6) throw Error();
      const data = JSON.parse(await f.text());
      if (!validState(data)) throw Error();
      confirmAction(
        "Restaurar backup?",
        "Os dados atuais serão substituídos por " +
          data.projects.length +
          " projeto(s) do backup.",
        () => {
          state = data;
          storageBlocked = false;
          save();
          render();
          toast("Backup restaurado.");
        },
      );
    } catch {
      toast(
        "Backup inválido. Selecione um arquivo JSON exportado pela plataforma.",
      );
    }
    t.value = "";
  }
});
root.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target,
    values = Object.fromEntries(new FormData(f));
  if (f.id === "project-form") {
    const checks = [...f.querySelectorAll("[data-check=project]:checked")].map(
      (c) => Number(c.value),
    );
    if (!values.title.trim()) {
      toast("Informe um título para o projeto.");
      return;
    }
    const p = {
      id: f.dataset.id === "new" ? crypto.randomUUID() : f.dataset.id,
      ...values,
      title: values.title.trim(),
      checks,
      updated: new Date().toISOString(),
    };
    const i = state.projects.findIndex((p) => p.id === f.dataset.id);
    if (i < 0) state.projects.unshift(p);
    else state.projects[i] = p;
    if (save()) {
      go("/app/projects/" + p.id);
      toast("Projeto salvo.");
    }
  }
  if (f.id === "brief-form") {
    const v = Object.fromEntries(
      briefLabels.map((l, i) => [l, values["b" + i] || ""]),
    );
    state.brief = v;
    save();
    showResult(briefingText(v), "Briefing estruturado");
  }
  if (f.id === "composer-form") {
    state.composer = values;
    save();
    const prompt = promptOptions().find((p) => p.id === values.prompt),
      project = state.projects.find((p) => p.id === values.project);
    const context = project
      ? briefingText({
          Projeto: project.title,
          Objetivo: project.objective,
          "Público-alvo": project.audience,
          Oferta: project.offer,
          Anotações: project.notes,
        })
      : "";
    showResult(
      prompt.content +
        (context || values.context.trim()
          ? "\n\n---\n\n# CONTEXTO DO PROJETO (ADICIONADO PELO USUÁRIO)\n\n" +
            context +
            "\n\n" +
            values.context.trim()
          : ""),
      "Prompt pronto para revisar",
    );
  }
});
document.addEventListener("click", (e) => {
  const sidebar = document.querySelector("#sidebar");
  if (
    sidebar?.classList.contains("open") &&
    !e.target.closest(".sidebar") &&
    !e.target.closest("[data-action=menu]")
  ) {
    sidebar.classList.remove("open");
    document
      .querySelector("[data-action=menu]")
      ?.setAttribute("aria-expanded", "false");
    syncNav();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelector("#sidebar")?.classList.remove("open");
    document
      .querySelector("[data-action=menu]")
      ?.setAttribute("aria-expanded", "false");
    syncNav();
  }
});
window.addEventListener("popstate", () => render());
matchMedia("(max-width:720px)").addEventListener("change", syncNav);
window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    const loaded = loadState();
    state = loaded.data;
    storageBlocked = !!loaded.error;
    render();
    toast(loaded.error || "Dados atualizados por outra aba.");
  }
});
matchMedia("(prefers-color-scheme:light)").addEventListener("change", theme);
async function start() {
  try {
    const response = await fetch("/app/materials.json");
    if (!response.ok) throw Error();
    materials = await response.json();
    materials.push({
      slug: "concept-example",
      title: "Concept-Hero de exemplo",
      category: "Referência",
      content: "",
      source:
        "https://drive.google.com/file/d/1atfqgIkGfgLcAkpj6LbdR3xGs6Gks9Ai/view",
      updated: "2026-09-14",
    });
    render();
    if (loaded.error) toast(loaded.error);
  } catch {
    root.innerHTML =
      "<main>" +
      heading(
        "Não foi possível carregar o acervo",
        "Verifique a conexão e tente novamente.",
      ) +
      '<button id="retry">Tentar novamente</button></main>';
    document.querySelector("#retry").onclick = start;
  }
}
start();
