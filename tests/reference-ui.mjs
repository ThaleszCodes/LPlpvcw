import assert from "node:assert/strict";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
});
const ctx = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
  viewport: { width: 1440, height: 1000 },
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const visit = async (p) => {
  await page.goto((process.env.BASE_URL || "http://localhost:4173") + p);
  await page.waitForSelector("h1");
  await page.waitForTimeout(320);
};
try {
  await visit("/");
  assert.equal(await page.locator(".hero-cta").getAttribute("href"), "/app");
  await visit("/app/projects/new");
  await page.getByLabel("Título do projeto").fill("Projeto real de teste");
  await page.getByLabel("Objetivo da página").fill("Captar contatos");
  await page.getByRole("button", { name: "Salvar projeto" }).click();
  await page.reload();
  assert.equal(
    await page.getByLabel("Título do projeto").inputValue(),
    "Projeto real de teste",
  );
  await visit("/app/projects");
  assert.equal(await page.locator(".project-item").count(), 1);
  await page.getByLabel("Buscar projeto").fill("não existe");
  assert.equal(await page.locator(".project-item").count(), 0);
  await page.getByRole("button", { name: "Limpar busca" }).click();
  await page.getByRole("button", { name: "Concluídos", exact: true }).click();
  assert.equal(await page.locator(".project-item").count(), 0);
  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await page.getByRole("link", { name: "Continuar", exact: true }).click();
  assert.ok(page.url().includes("/app/projects/"));
  await visit("/app/methods");
  const before = await page.locator(".method-canvas").textContent();
  await page.locator('[data-action=principle][data-value="4"]').click();
  assert.notEqual(before, await page.locator(".method-canvas").textContent());
  await visit("/app/prompts");
  const original = await page.locator("#prompt-text").inputValue();
  await page
    .getByRole("button", { name: "Copiar prompt", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    original,
  );
  await page.getByRole("button", { name: "Favoritar prompt" }).click();
  await page.reload();
  assert.equal(
    await page
      .getByRole("button", { name: "Favoritar prompt" })
      .getAttribute("aria-pressed"),
    "true",
  );
  for (const width of [360, 390, 430, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/app",
      "/app/projects",
      "/app/methods",
      "/app/prompts",
    ]) {
      await visit(route);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width} ${route} overflow`,
      );
      if (process.env.SCREENSHOT_DIR && (width === 390 || width === 1440))
        await page.screenshot({
          path:
            process.env.SCREENSHOT_DIR +
            "/ref-" +
            width +
            "-" +
            route.split("/").pop() +
            ".png",
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("/app/prompts");
  await page.locator("[data-action=open-prompts]").click();
  assert.ok(await page.locator("dialog").evaluate((d) => d.open));
  await page.locator("dialog #prompt-search").fill("BG");
  await page.locator("dialog [data-action=select-prompt]").first().click();
  assert.equal(await page.locator("dialog").evaluate((d) => d.open), false);
  await page.getByRole("button", { name: "Usar no projeto" }).click();
  assert.ok(page.url().includes("composer"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit("/app");
  assert.equal(
    await page
      .locator("main")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS landing, project create/open/persistence/search/filters, official prompt clipboard/favorites, methods, mobile sheet, composer, reduced motion, 24 responsive route checks; no runtime errors",
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  process.exit(process.exitCode || 0);
}
