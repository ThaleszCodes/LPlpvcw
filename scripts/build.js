import { cp, mkdir, rm, readFile, stat } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const path of ["index.html", "styles.css", "assets", "fonts", "app"])
  await cp(path, "dist/" + path, { recursive: true });
const materials = JSON.parse(await readFile("app/materials.json", "utf8"));
if (materials.length !== 6 || materials.some((m) => !m.content?.trim()))
  throw Error("Official content missing");
await stat("dist/app/concept.png");
console.log(
  "Static build ready: original landing page + LPVCW Platform, 6 complete documents and visual reference.",
);
