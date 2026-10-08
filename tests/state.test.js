import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  validState,
  loadState,
  KEY,
  criteria,
  progress,
  briefingText,
  planText,
  auditText,
} from "../app/state.js";
test("backup round-trip preserves project context, checks, drafts and onboarding", () => {
  const s = fresh();
  s.projects.push({
    id: "test",
    title: "Oferta",
    objective: "Vender",
    audience: "Empresas",
    offer: "Site",
    notes: "Concept aprovado",
    checks: [0, 1],
    updated: new Date().toISOString(),
  });
  s.onboarding.step = 3;
  s.sections.push({
    id: "section",
    title: "Hero",
    objective: "Apresentar oferta",
    notes: "RV aprovada",
  });
  s.brief = { Marca: "Atos" };
  const serialized = JSON.stringify(s);
  assert.ok(validState(JSON.parse(serialized)));
  assert.deepEqual(
    loadState({ getItem: (k) => (k === KEY ? serialized : null) }).data,
    s,
  );
  assert.equal(progress(s.projects[0].checks), 20);
});
test("invalid backups and corrupted storage are rejected without deleting original data", () => {
  for (const value of [
    null,
    [],
    {},
    { ...fresh(), projects: [{ id: "a" }] },
    { ...fresh(), audit: [-1] },
    { ...fresh(), audit: [0, 0] },
    { ...fresh(), theme: "invalid" },
    { ...fresh(), onboarding: { step: 8, completed: false } },
  ])
    assert.equal(validState(value), false);
  let raw = "{broken";
  const result = loadState({ getItem: () => raw });
  assert.ok(result.error);
  assert.equal(raw, "{broken");
});
test("exports include real section ordering and unchecked audit criteria", () => {
  assert.match(briefingText({ Marca: "Atos", Público: "" }), /## Marca\nAtos/);
  assert.ok(!briefingText({ Marca: "Atos", Público: "" }).includes("Público"));
  const sections = [
    { title: "Hero", objective: "Introdução", notes: "BG" },
    { title: "Oferta", objective: "Converter", notes: "" },
  ];
  assert.ok(
    planText(sections).indexOf("1. Hero") <
      planText(sections).indexOf("2. Oferta"),
  );
  assert.match(auditText([0]), /\[x\] Briefing/);
  assert.match(auditText([0]), /\[ \] Concept/);
  assert.equal(progress(criteria.map((_, i) => i)), 100);
});
