import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

function contentType(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

async function resolveTarget(urlPath: string): Promise<string | null> {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const safe = path.posix.normalize(decoded).replace(/^\/+/, "");
  const absolute = path.join(distDir, safe);
  if (!absolute.startsWith(distDir)) {
    return null;
  }

  try {
    const stat = await fs.stat(absolute);
    if (stat.isDirectory()) {
      const indexPath = path.join(absolute, "index.html");
      const indexStat = await fs.stat(indexPath).catch(() => null);
      return indexStat?.isFile() ? indexPath : null;
    }
    return stat.isFile() ? absolute : null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Bad Request");
    return;
  }

  const target = await resolveTarget(req.url);
  if (!target) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not Found");
    return;
  }

  try {
    const data = await fs.readFile(target);
    res.writeHead(200, {
      "Content-Type": contentType(target),
      "Cache-Control": "no-cache"
    });
    res.end(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end(message);
  }
});

const distExists = await fs
  .stat(distDir)
  .then((s) => s.isDirectory())
  .catch(() => false);

if (!distExists) {
  console.error(`dist/ not found at ${distDir}. Run \`npm run build\` first.`);
  process.exit(1);
}

server.listen(port, host, () => {
  console.log(`Serving ${distDir} at http://${host}:${port}`);
});
