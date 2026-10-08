import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const base = resolve(process.argv[2] || "."),
  port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".md": "text/markdown",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (
      /^\/app(?:\/(?:onboarding|library(?:\/[^/]+)?|projects(?:\/[^/]+)?|tools(?:\/[^/]+)?|settings))?\/?$/.test(
        path,
      )
    )
      path = "/app/index.html";
    if (path === "/") path = "/index.html";
    const file = resolve(base, "." + path);
    if (!file.startsWith(base + "/")) throw Error();
    if ((await stat(file)).isDirectory()) throw Error();
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, "0.0.0.0", () =>
  console.log("LPVCW local server: http://localhost:" + port),
);
