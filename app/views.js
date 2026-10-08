export function createViews({
  esc,
  icon,
  link,
  button,
  heading,
  progress,
  criteria,
  promptOptions,
  getState,
  getMaterials,
}) {
  const drafts = new Map();
  let query = "",
    status = "Todos",
    principle = 0,
    version = 1,
    promptId = "",
    promptQuery = "",
    favorites = false;
  const principles = [
    [
      "Visual antes do código",
      "Aprove a direção antes de implementar.",
      "Concept → aprovação → BG → IP → código. O Concept define a composição; a aprovação orienta o trabalho seguinte.",
      "manual",
    ],
    [
      "Uma seção por vez",
      "Cada dobra tem uma função.",
      "Desenvolva cada seção com referência visual aprovada, background e Implementation Prompt próprios.",
      "workflow",
    ],
    [
      "Fold Continuity",
      "Conecte o ritmo entre as dobras.",
      "Preserve atmosfera, fundos e ritmo visual entre seções. Uma nova dobra deve continuar a experiência da anterior.",
      "manual",
    ],
    [
      "Identidade ≠ template",
      "Varie a composição, preserve a identidade.",
      "Tipografia, atmosfera e linguagem permanecem consistentes. A estrutura deve responder à função de cada seção.",
      "manual",
    ],
    [
      "Hierarquia e respiro",
      "Dê espaço ao que importa.",
      "Reduza a entropia visual. Preserve poucos focos dominantes e remova decoração sem função.",
      "direcao-clean",
    ],
    [
      "Mobile recomposto",
      "Reorganize para a tela pequena.",
      "Adapte ordem, enquadramento, leitura e ação principal. O mobile precisa de uma composição própria.",
      "ativacao",
    ],
  ];
  const wire = (cls = "") =>
    `<div class="wireframe ${cls}" aria-hidden="true"><div class="wire-top"><i></i><i></i><i></i></div><div class="wire-body"><div><b></b><b></b><em></em><em></em><strong></strong></div><div class="wire-image"></div></div><div class="wire-tiles"><span></span><span></span><span></span></div></div>`;
  function home() {
    const existing = getState().projects.length;
    return (
      heading(
        'Vamos tirar sua próxima<br class="desktop-break"> landing page do papel.',
        "Da ideia à estrutura, com clareza em cada etapa.",
      ) +
      `<section class="start-surface"><div class="start-copy"><span class="eyebrow">COMECE POR AQUI</span><h2>Uma boa página começa<br> com uma direção clara.</h2><p>Defina o objetivo, o público e a oferta do seu projeto.</p></div><div class="page-illustration">${wire("back-left")}${wire("back-right")}${wire("front")}</div>${link(existing ? "/app/projects" : "/app/projects/new", (existing ? "Continuar meus projetos" : "Criar meu primeiro projeto") + icon("arrow-right"), "button primary start-action")}</section><section class="explore"><h2>Explore o método</h2><p>A base para criar com intenção.</p><div class="explore-paths">${[
        [
          "Entenda a metodologia",
          "Conheça o fluxo oficial do LPVCW.",
          "/app/methods",
          "Explorar",
        ],
        [
          "Prepare a estrutura",
          "Organize a mensagem e as seções.",
          "/app/tools/sections",
          "Ver orientações",
        ],
        [
          "Leve para a criação",
          "Use os prompts como ponto de partida.",
          "/app/prompts",
          "Abrir biblioteca",
        ],
      ]
        .map(
          ([t, d, u, a], i) =>
            `<article><span class="path-number">0${i + 1}</span><div><h3>${t}</h3><p>${d}</p>${link(u, a + icon("arrow-right"), "text-link")}</div></article>`,
        )
        .join("")}</div></section>`
    );
  }
  function projectRows() {
    const all = getState().projects;
    const list = all.filter(
      (p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) &&
        (status === "Todos" ||
          (status === "Concluídos"
            ? progress(p.checks) === 100
            : progress(p.checks) < 100)),
    );
    return list.length
      ? `<div class="project-table"><div class="table-labels"><span>PROJETO</span><span>ETAPA ATUAL</span><span>ATUALIZADO</span><span></span></div>${list
          .map((p) => {
            const n = progress(p.checks),
              stage =
                n === 100
                  ? "Concluído"
                  : criteria.find((_, i) => !p.checks.includes(i))?.[0];
            return `<article class="project-item"><div class="project-identity"><div class="neutral-thumbnail" aria-hidden="true">${icon("file-text")}</div><div><h3>${esc(p.title)}</h3><p>${esc(p.objective || "Objetivo ainda não definido")}</p></div></div><span class="project-stage">${icon(n === 100 ? "circle-check" : "circle")}${esc(stage)}</span><span class="project-date">${new Date(p.updated).toLocaleDateString("pt-BR")}</span><div class="project-open">${link("/app/projects/" + p.id, (n === 100 ? "Abrir projeto" : "Continuar") + icon("arrow-right"), "text-link")}${button("delete-project", icon("trash-2"), "icon-button", 'data-id="' + p.id + '" aria-label="Excluir ' + esc(p.title) + '"')}</div></article>`;
          })
          .join(
            "",
          )}<div class="table-foot">${list.length} projeto(s) · progresso baseado no checklist</div></div>`
      : `<div class="empty"><h3>${all.length ? "Nenhum resultado encontrado." : "Seu primeiro projeto começa aqui."}</h3><p>${all.length ? "Tente outro nome ou filtro." : "Registre objetivo, público e oferta para aplicar o método."}</p>${all.length ? button("clear-project-search", "Limpar busca") : link("/app/projects/new", "Criar meu primeiro projeto", "button primary")}</div>`;
  }
  function projects() {
    return (
      heading(
        "Seus projetos",
        "Retome de onde parou ou comece uma nova página.",
        link(
          "/app/projects/new",
          icon("plus") + "Novo projeto",
          "button primary",
        ),
      ) +
      `<div class="project-controls"><label class="search-control">${icon("search")}<input id="project-search" aria-label="Buscar projeto" placeholder="Buscar projeto…" value="${esc(query)}"></label><div class="segmented" aria-label="Filtrar projetos">${["Todos", "Em andamento", "Concluídos"].map((t) => button("project-filter", t, status === t ? "selected" : "", 'data-value="' + t + '" aria-pressed="' + (status === t) + '"')).join("")}</div></div><div id="project-results">${projectRows()}</div><div class="context-strip">${icon("file-text")}<span>Cada projeto reúne seu contexto, decisões e checklist.</span>${link("/app/methods", "Conhecer o método" + icon("arrow-right"), "text-link")}</div>`
    );
  }
  function demo(applied) {
    const p = principle;
    if (p === 0)
      return `<div class="process-demo ${applied ? "applied" : ""}">${(applied ? ["Concept", "Aprovação", "BG + IP", "Código"] : ["Código", "Revisões", "Nova direção", "Retrabalho"]).map((t, i) => `<div><small>0${i + 1}</small><strong>${t}</strong></div>`).join("")}</div>`;
    if (p === 1)
      return `<div class="section-demo ${applied ? "applied" : ""}">${(applied ? ["Hero · direção aprovada", "Benefícios · referência própria", "Prova · conteúdo real"] : ["Todas as seções juntas", "Composição repetida", "Sem revisão por dobra"]).map((t) => `<div>${t}</div>`).join("")}</div>`;
    return `<div class="mini-page demo-${p} ${applied ? "applied" : "before"}"><div class="mini-top"><span>● ● ●</span><span>Produto &nbsp; Sobre</span></div><div class="mini-content"><h3>Seu próximo projeto começa aqui.</h3><p>Conecte ideias e organize seu processo com uma direção clara.</p><span class="demo-cta">Começar</span><div class="demo-blocks"><div>Planeje</div><div>Colabore</div><div>Evolua</div></div>${p === 2 || p === 3 ? '<div class="demo-next"><strong>Uma próxima seção, a mesma identidade.</strong></div>' : ""}</div></div>`;
  }
  function methods() {
    const [name, title, desc, slug] = principles[principle];
    return (
      heading(
        "Entenda. Aplique. Refine.",
        "Os princípios do LPVCW, na prática.",
        link(
          "/app/projects",
          "Abrir meu projeto" + icon("arrow-up-right"),
          "button",
        ),
      ) +
      `<div class="methods-layout"><aside class="principle-selector"><h2>Princípios</h2><div>${principles.map(([n], i) => button("principle", `<small>0${i + 1}</small><span>${n}</span>`, principle === i ? "selected" : "", 'data-value="' + i + '" aria-pressed="' + (principle === i) + '"')).join("")}</div><p>Escolha um princípio para explorar.</p></aside><section class="method-canvas"><span class="eyebrow">0${principle + 1} / ${name}</span><h2>${title}</h2><p>${desc}</p><div class="comparison-switch segmented">${button("demo-version", "Sem aplicar", version === 0 ? "selected" : "", 'data-value="0" aria-pressed="' + (version === 0) + '"')}${button("demo-version", "Com o método", version === 1 ? "selected" : "", 'data-value="1" aria-pressed="' + (version === 1) + '"')}</div><div class="comparisons">${[0, 1].map((v) => `<figure class="comparison ${version === v ? "visible-version" : ""}"><figcaption>${v ? "Com o método" : "Sem aplicar"}</figcaption>${demo(v)}</figure>`).join("")}</div><p class="demo-note">${icon("arrow-right")}Demonstração didática. ${link("/app/library/" + slug, "Consultar fundamento oficial", "text-link")}</p></section></div><div class="apply-strip"><div><h3>Agora, leve para sua página.</h3><p>Revise as decisões e o checklist do seu projeto.</p></div>${link(getState().projects.length ? "/app/projects/" + getState().projects[0].id : "/app/projects/new", "Aplicar no projeto" + icon("arrow-right"), "button primary")}</div>`
    );
  }
  function activePrompt() {
    const opts = promptOptions();
    return opts.find((p) => p.id === promptId) || opts[0];
  }
  function promptList() {
    const opts = promptOptions().filter(
      (p) =>
        (p.title + " " + p.content)
          .toLowerCase()
          .includes(promptQuery.toLowerCase()) &&
        (!favorites || getState().favorites.includes("prompt:" + p.id)),
    );
    return `<label class="search-control">${icon("search")}<input id="prompt-search" placeholder="Buscar prompt…" aria-label="Buscar prompt" value="${esc(promptQuery)}"></label><div class="prompt-tabs">${button("prompt-filter", "Todos", !favorites ? "selected" : "", 'data-value="all"')}${button("prompt-filter", "Favoritos", favorites ? "selected" : "", 'data-value="favorites"')}</div><div id="prompt-list">${opts.length ? opts.map((p) => button("select-prompt", `<strong>${esc(p.title)}</strong><small>Prompt oficial LPVCW</small>${icon("chevron-right")}`, activePrompt()?.id === p.id ? "selected" : "", 'data-id="' + p.id + '"')).join("") : '<p class="empty">Nenhum prompt encontrado.</p>'}</div>`;
  }
  function prompts() {
    const p = activePrompt();
    if (!p)
      return (
        heading("Biblioteca de prompts") +
        "<p>Acervo indisponível. Recarregue a página.</p>"
      );
    return (
      heading(
        "Biblioteca de prompts",
        "Escolha, adapte e leve para sua ferramenta de criação.",
      ) +
      `<div class="prompt-mobile-selector">${button("open-prompts", icon("book-open") + "<span>" + esc(p.title) + "</span>" + icon("chevron-down"), "prompt-select")}<span>Escolha um prompt da biblioteca oficial.</span></div><div class="prompts-layout"><aside class="prompt-library">${promptList()}</aside><section class="prompt-detail"><div class="section-head"><span class="eyebrow">PROMPT OFICIAL</span>${button("save-prompt", icon("bookmark"), "icon-button", 'aria-label="Favoritar prompt" aria-pressed="' + getState().favorites.includes("prompt:" + p.id) + '"')}</div><h2>${esc(p.title)}</h2><p>Revise os campos entre colchetes antes de usar. As instruções originais estão preservadas.</p><textarea class="prompt-text" id="prompt-text" aria-label="Texto completo do prompt, editável" spellcheck="false">${esc(drafts.get(p.id) ?? p.content)}</textarea><div class="prompt-actions"><span>Adapte ao contexto do seu projeto.</span>${button("copy-prompt", icon("copy") + "Copiar prompt", "primary")}${button("use-prompt", "Usar no projeto" + icon("arrow-right"))}</div>${link("/app/library/" + p.slug, "Abrir documento original" + icon("arrow-up-right"), "text-link")}</section></div>`
    );
  }
  function handle(action, b, { render, save, copy, toast, go, dialog, state }) {
    if (action === "project-filter") {
      status = b.dataset.value;
      render();
      return true;
    }
    if (action === "clear-project-search") {
      query = "";
      status = "Todos";
      render();
      return true;
    }
    if (action === "principle" || action === "demo-version") {
      if (action === "principle") principle = Number(b.dataset.value);
      else version = Number(b.dataset.value);
      render();
      document
        .querySelector(
          '[data-action="' +
            action +
            '"][data-value="' +
            b.dataset.value +
            '"]',
        )
        ?.focus();
      return true;
    }
    if (action === "select-prompt") {
      promptId = b.dataset.id;
      dialog.close();
      render();
      document.querySelector("#prompt-text")?.focus();
      return true;
    }
    if (action === "prompt-filter") {
      favorites = b.dataset.value === "favorites";
      if (dialog.open) {
        dialog.querySelector(".sheet-body").innerHTML = promptList();
        window.lucide?.createIcons();
      } else render();
      return true;
    }
    if (action === "save-prompt") {
      const id = "prompt:" + activePrompt().id;
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((x) => x !== id)
        : [...state.favorites, id];
      save();
      render();
      return true;
    }
    if (action === "copy-prompt") {
      copy(document.querySelector("#prompt-text").value, "Prompt copiado");
      return true;
    }
    if (action === "use-prompt") {
      state.composer.prompt = activePrompt().id;
      save();
      go("/app/tools/composer");
      return true;
    }
    if (action === "open-prompts") {
      dialog.classList.add("prompt-sheet");
      dialog.innerHTML =
        '<div class="section-head"><h2>Biblioteca de prompts</h2><button id="close-sheet" aria-label="Fechar biblioteca">' +
        icon("x") +
        '</button></div><div class="sheet-body">' +
        promptList() +
        "</div>";
      dialog.showModal();
      dialog.querySelector("#close-sheet").onclick = () => closeSheet(dialog);
      window.lucide?.createIcons();
      return true;
    }
    return false;
  }
  document
    .querySelector("#dialog")
    .addEventListener("close", () =>
      document.querySelector("#dialog").classList.remove("prompt-sheet"),
    );
  function input(t) {
    if (t.id === "prompt-text") {
      drafts.set(activePrompt().id, t.value);
      return true;
    }
    if (t.id === "project-search") {
      query = t.value;
      document.querySelector("#project-results").innerHTML = projectRows();
      window.lucide?.createIcons();
      return true;
    }
    if (t.id === "prompt-search") {
      promptQuery = t.value;
      const parent = t.closest(".sheet-body") || t.closest(".prompt-library");
      const holder = document.createElement("div");
      holder.innerHTML = promptList();
      parent.querySelector("#prompt-list").innerHTML =
        holder.querySelector("#prompt-list").innerHTML;
      window.lucide?.createIcons();
      return true;
    }
    return false;
  }
  function closeSheet(d) {
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
      d.close();
      return;
    }
    d.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(6px)" },
      ],
      { duration: 160, easing: "ease-out" },
    ).finished.then(() => d.close());
  }
  document.querySelector("#dialog").addEventListener("cancel", (e) => {
    if (e.target.classList.contains("prompt-sheet")) {
      e.preventDefault();
      closeSheet(e.target);
    }
  });
  return { home, projects, methods, prompts, handle, input };
}
