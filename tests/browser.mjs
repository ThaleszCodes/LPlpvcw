import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
let executablePath = process.env.CHROMIUM_PATH;
let args = [];
if (process.env.CHROMIUM_MODULE) {
  const { default: c } = await import(process.env.CHROMIUM_MODULE);
  executablePath = await c.executablePath();
  args = c.args;
}
const browser = await chromium.launch({ headless: true, executablePath, args });
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.BASE_URL || "http://localhost:4173";
const visit = async (path) => {
  await page.goto(base + path);
  await page.waitForSelector("h1");
};
const check = async (label, fn) => {
  await fn();
  console.log("PASS " + label);
};
try {
  await check("original landing and CTA", async () => {
    await visit("/");
    assert.equal(await page.locator(".hero-cta").getAttribute("href"), "/app");
    assert.equal(await page.locator(".hero-section").count(), 1);
  });
  await check("dashboard and onboarding persistence", async () => {
    await visit("/app");
    assert.ok(
      await page
        .getByRole("heading", {
          name: "Vamos tirar sua próxima landing page do papel.",
        })
        .count(),
    );
    await visit("/app/onboarding");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.reload();
    await page.waitForSelector(".step-number");
    assert.match(await page.locator(".step-number").textContent(), /02/);
    for (let i = 0; i < 4; i++)
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
    await page.getByRole("button", { name: "Concluir introdução" }).click();
    assert.ok(
      await page
        .getByRole("heading", {
          name: "Vamos tirar sua próxima landing page do papel.",
        })
        .count(),
    );
  });
  await check(
    "library search, filters, complete document and clipboard",
    async () => {
      await visit("/app/library");
      assert.equal(await page.locator(".library-row").count(), 7);
      await page.getByLabel("Buscar no acervo").fill("Concept");
      assert.ok((await page.locator(".library-row").count()) > 0);
      await page.getByLabel("Buscar no acervo").fill("inexistente-xyz");
      assert.equal(await page.locator(".library-row").count(), 0);
      await page.getByLabel("Buscar no acervo").fill("");
      await page.getByLabel("Filtrar por categoria").selectOption("Prompt");
      assert.equal(await page.locator(".library-row").count(), 4);
      await visit("/app/library/ativacao");
      await page
        .getByRole("button", { name: "Copiar conteúdo", exact: true })
        .click();
      const docs = JSON.parse(await readFile("app/materials.json"));
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        docs.find((d) => d.slug === "ativacao").content,
      );
      await page.getByRole("button", { name: "Salvar", exact: true }).click();
      await visit("/app/library");
      await page.getByLabel("Filtrar por categoria").selectOption("Favoritos");
      assert.equal(await page.locator(".library-row").count(), 1);
      await visit("/app/library/concept-example");
      await page.locator(".concept").waitFor();
      assert.ok(
        await page
          .locator(".concept")
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      );
    },
  );
  await check("project create, edit, reload and real progress", async () => {
    await visit("/app/projects/new");
    await page.getByLabel("Título do projeto").fill("Projeto de teste");
    await page
      .getByLabel("Objetivo da página")
      .fill("Apresentar uma oferta real");
    await page.getByLabel("Público-alvo").fill("Empresas locais");
    await page.getByLabel("Oferta", { exact: true }).fill("Landing Page");
    await page.locator("[data-check=project]").first().check();
    await page.getByRole("button", { name: "Salvar projeto" }).click();
    await page.reload();
    await page.waitForSelector("#project-form");
    assert.equal(
      await page.getByLabel("Título do projeto").inputValue(),
      "Projeto de teste",
    );
    assert.match(await page.locator("#project-progress").textContent(), /10%/);
    await page.getByLabel("Anotações e decisões").fill("Concept aprovado");
    await page.getByRole("button", { name: "Salvar projeto" }).click();
    await page.reload();
    await page.waitForSelector("#project-form");
    assert.equal(
      await page.getByLabel("Anotações e decisões").inputValue(),
      "Concept aprovado",
    );
  });
  await check("briefing generator and draft persistence", async () => {
    await visit("/app/tools/briefing");
    await page.getByLabel("Marca / projeto").fill("Atos");
    await page.getByLabel("CTA principal").fill("Solicitar orçamento");
    await page.getByRole("button", { name: "Gerar briefing" }).click();
    assert.match(
      await page.locator(".output").textContent(),
      /Solicitar orçamento/,
    );
    await page.getByRole("button", { name: "Copiar resultado" }).click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /# BRIEFING LPVCW/,
    );
    await page.reload();
    await page.waitForSelector("#brief-form");
    assert.equal(await page.getByLabel("Marca / projeto").inputValue(), "Atos");
  });
  await check("prompt composer preserves original instructions", async () => {
    await visit("/app/tools/composer");
    assert.equal(await page.locator("select[name=prompt] option").count(), 23);
    await page.getByLabel("Prompt oficial").selectOption("prompts-rapidos:2");
    await page
      .getByLabel("Usar contexto de um projeto")
      .selectOption({ label: "Projeto de teste" });
    await page.getByLabel("Contexto adicional").fill("Paleta monocromática");
    await page.getByRole("button", { name: "Montar prompt" }).click();
    const result = await page.locator(".output").textContent();
    assert.ok(result.startsWith("Vamos criar o Concept-Hero."));
    assert.ok(result.includes("Projeto de teste"));
    assert.ok(result.includes("Paleta monocromática"));
  });
  await check("section planner reorder and persistence", async () => {
    await visit("/app/tools/sections");
    await page.getByRole("button", { name: "Adicionar seção" }).click();
    await page
      .getByLabel("Objetivo", { exact: true })
      .fill("Comunicar a proposta");
    await page.getByRole("button", { name: "Adicionar seção" }).click();
    await page.getByLabel("Nome da seção").nth(1).fill("Oferta");
    await page
      .getByRole("button", { name: "Mover seção para cima" })
      .nth(1)
      .click();
    assert.equal(
      await page.getByLabel("Nome da seção").first().inputValue(),
      "Oferta",
    );
    await page.reload();
    await page.waitForSelector(".section-editor");
    assert.equal(
      await page.getByLabel("Nome da seção").first().inputValue(),
      "Oferta",
    );
    await page.getByRole("button", { name: "Copiar planejamento" }).click();
    assert.ok(
      (await page.evaluate(() => navigator.clipboard.readText())).includes(
        "1. Oferta",
      ),
    );
  });
  await check("audit persistence and export", async () => {
    await visit("/app/tools/audit");
    await page.locator("[data-check=audit]").first().check();
    await page.reload();
    await page.waitForSelector("#audit-progress");
    assert.match(await page.locator("#audit-progress").textContent(), /10%/);
    await page.getByRole("button", { name: "Copiar relatório" }).click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /\[x\] Briefing/,
    );
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar .txt" }).click();
    assert.equal((await dl).suggestedFilename(), "auditoria-lpvcw.txt");
  });
  let backup;
  await check("backup download, validation and restore", async () => {
    await visit("/app/settings");
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar backup" }).click();
    backup = await readFile(await (await dl).path());
    await page.locator("#backup-file").setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
    await page.waitForFunction(() =>
      document.querySelector("#toast").textContent.includes("Backup inválido"),
    );
    await page.locator("#backup-file").setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: backup,
    });
    await page.getByRole("button", { name: "Confirmar", exact: true }).click();
    await visit("/app/projects");
    assert.ok(
      await page.getByRole("heading", { name: "Projeto de teste" }).count(),
    );
  });
  await check(
    "project deletion requires confirmation and persists",
    async () => {
      await page
        .getByRole("button", { name: "Excluir Projeto de teste" })
        .click();
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      assert.ok(
        await page.getByRole("heading", { name: "Projeto de teste" }).count(),
      );
      await page
        .getByRole("button", { name: "Excluir Projeto de teste" })
        .click();
      await page
        .getByRole("button", { name: "Confirmar", exact: true })
        .click();
      await page.reload();
      await page.waitForSelector("h1");
      assert.equal(await page.locator(".project-item").count(), 0);
    },
  );
  await check(
    "mobile navigation, all routes and no horizontal overflow",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      for (const path of [
        "/app",
        "/app/onboarding",
        "/app/library",
        "/app/library/ativacao",
        "/app/projects",
        "/app/projects/new",
        "/app/tools",
        "/app/tools/briefing",
        "/app/tools/composer",
        "/app/tools/sections",
        "/app/tools/audit",
        "/app/settings",
      ]) {
        await visit(path);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          path + " overflow",
        );
      }
      await page.locator('.mobile-nav a[href="/app/prompts"]').click();
      await page.waitForSelector("#prompt-text");
      await page.screenshot({
        path: process.env.SCREENSHOT_DIR
          ? process.env.SCREENSHOT_DIR + "/mobile.png"
          : "test-results/mobile.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await visit("/app");
      await page.screenshot({
        path: process.env.SCREENSHOT_DIR
          ? process.env.SCREENSHOT_DIR + "/desktop.png"
          : "test-results/desktop.png",
        fullPage: true,
      });
    },
  );
  assert.deepEqual(errors, []);
  console.log("PASS no browser runtime errors");
} finally {
  await browser.close();
}
