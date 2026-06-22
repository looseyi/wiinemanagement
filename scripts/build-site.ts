import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { siteData } from "../src/content/site-data.ts";
import { renderPage, routeToOutputPath } from "../src/lib/render.ts";

const run = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

async function ensureCleanDir(targetDir: string): Promise<void> {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
}

async function compileStyles(distDir: string): Promise<void> {
  const binName = process.platform === "win32" ? "tailwindcss.cmd" : "tailwindcss";
  const tailwindBin = path.join(projectRoot, "node_modules", ".bin", binName);
  const input = path.join(projectRoot, "src", "styles", "site.css");
  const output = path.join(distDir, "assets", "styles.css");

  await run(tailwindBin, ["-i", input, "-o", output, "--minify"], {
    cwd: projectRoot
  });
}

async function copyPublicAssets(distDir: string): Promise<void> {
  const sourceDir = path.join(projectRoot, "public");
  const targetDir = path.join(distDir, "assets");
  await fs.mkdir(targetDir, { recursive: true });

  for (const entry of await fs.readdir(sourceDir)) {
    if (entry === "styles.css") {
      continue;
    }

    await fs.cp(path.join(sourceDir, entry), path.join(targetDir, entry), { recursive: true });
  }
}

async function writePages(distDir: string): Promise<string[]> {
  const outputs: string[] = [];

  for (const page of siteData.pages) {
    const relativeOutputPath = routeToOutputPath(page.slug);
    const absoluteOutputPath = path.join(distDir, relativeOutputPath);
    await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await fs.writeFile(absoluteOutputPath, renderPage(page, siteData), "utf8");
    outputs.push(relativeOutputPath);
  }

  return outputs;
}

async function buildSite(targetDir = path.join(projectRoot, "dist")): Promise<{ targetDir: string; pages: string[] }> {
  await ensureCleanDir(targetDir);
  await fs.mkdir(path.join(targetDir, "assets"), { recursive: true });
  await compileStyles(targetDir);
  await copyPublicAssets(targetDir);
  const pages = await writePages(targetDir);
  return { targetDir, pages };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildSite();
  console.log(`Built ${result.pages.length} pages into ${result.targetDir}`);
}

export { buildSite };
