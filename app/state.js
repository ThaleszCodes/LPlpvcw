export const KEY = "lpvcw-platform-v1";
export const criteria = [
  [
    "Briefing definido",
    "Marca, produto, público, objetivo, oferta, CTA, identidade e assets documentados.",
    "ativacao",
  ],
  [
    "Concept-Hero aprovado",
    "A direção visual foi aprovada antes da implementação.",
    "manual",
  ],
  [
    "Background separado",
    "O BG preserva somente o ambiente; conteúdo e UI permanecem em código.",
    "manual",
  ],
  [
    "IP preparado com assets reais",
    "Referência, BG, estrutura, conteúdo, responsividade e restrições especificados.",
    "implementation-prompt",
  ],
  [
    "Referências das seções aprovadas",
    "Cada nova seção segue RV → aprovação → BG → IP → implementação.",
    "workflow",
  ],
  [
    "Fold Continuity revisada",
    "Cores, iluminação, fundos e ritmo conectam as dobras.",
    "manual",
  ],
  [
    "Identidade preservada, composição variada",
    "Tipografia e atmosfera consistentes sem repetir o mesmo layout.",
    "manual",
  ],
  [
    "Hierarquia e respiro revisados",
    "Poucos focos dominantes; sem textos ou decoração apenas para preencher espaço.",
    "direcao-clean",
  ],
  [
    "Mobile recomposto",
    "Ordem, enquadramento, leitura e CTA adaptados ao celular.",
    "ativacao",
  ],
  [
    "Implementação fiel e preservada",
    "Referências guiam o resultado e seções aprovadas permanecem intactas.",
    "ativacao",
  ],
];
export const fresh = () => ({
  version: 1,
  onboarding: { step: 0, completed: false },
  projects: [],
  favorites: [],
  theme: "dark",
  brief: {},
  composer: { prompt: "", project: "", context: "" },
  sections: [],
  audit: [],
});
const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const string = (v) => typeof v === "string" && v.length <= 100000;
const checks = (v) =>
  Array.isArray(v) &&
  v.every((i) => Number.isInteger(i) && i >= 0 && i < criteria.length) &&
  new Set(v).size === v.length;
const safeId = (v) => string(v) && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
export function validState(v) {
  if (
    !object(v) ||
    v.version !== 1 ||
    !object(v.onboarding) ||
    !Number.isInteger(v.onboarding.step) ||
    v.onboarding.step < 0 ||
    v.onboarding.step > 5 ||
    typeof v.onboarding.completed !== "boolean"
  )
    return false;
  if (
    !["dark", "light", "system"].includes(v.theme) ||
    !Array.isArray(v.favorites) ||
    !v.favorites.every(string) ||
    !checks(v.audit)
  )
    return false;
  if (
    !Array.isArray(v.projects) ||
    v.projects.length > 1000 ||
    !v.projects.every(
      (p) =>
        object(p) &&
        safeId(p.id) &&
        ["title", "objective", "audience", "offer", "notes", "updated"].every(
          (k) => string(p[k]),
        ) &&
        p.title.trim() &&
        Number.isFinite(Date.parse(p.updated)) &&
        checks(p.checks),
    )
  )
    return false;
  if (new Set(v.projects.map((p) => p.id)).size !== v.projects.length)
    return false;
  if (
    !object(v.brief) ||
    !Object.values(v.brief).every(string) ||
    !object(v.composer) ||
    !["prompt", "project", "context"].every((k) => string(v.composer[k]))
  )
    return false;
  return (
    Array.isArray(v.sections) &&
    v.sections.length <= 200 &&
    new Set(v.sections.map((s) => s?.id)).size === v.sections.length &&
    v.sections.every(
      (s) =>
        object(s) &&
        safeId(s.id) &&
        ["title", "objective", "notes"].every((k) => string(s[k])),
    )
  );
}
export function loadState(storage = localStorage) {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return { data: fresh() };
    const data = JSON.parse(raw);
    if (!validState(data)) throw new Error();
    return { data };
  } catch {
    return {
      data: fresh(),
      error:
        "Não foi possível ler seus dados locais. Exporte o backup de recuperação antes de salvar novas alterações.",
    };
  }
}
export const progress = (checks) =>
  Math.round((checks.length / criteria.length) * 100);
export function briefingText(values) {
  return (
    "# BRIEFING LPVCW\n\n" +
    Object.entries(values)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => "## " + k + "\n" + v.trim())
      .join("\n\n")
  );
}
export const planText = (sections) =>
  "# PLANEJAMENTO DE SEÇÕES\n\n" +
  sections
    .map((s, i) =>
      [
        i + 1 + ". " + (s.title || "Seção sem título"),
        "Objetivo: " + s.objective,
        "Observações: " + s.notes,
      ].join("\n"),
    )
    .join("\n\n");
export const auditText = (checked) =>
  "# AUDITORIA LPVCW\n\nProgresso: " +
  progress(checked) +
  "%\n\n" +
  criteria
    .map(
      ([title, desc], i) =>
        (checked.includes(i) ? "[x] " : "[ ] ") + title + "\n" + desc,
    )
    .join("\n\n");
