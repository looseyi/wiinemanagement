import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { siteData } from "../src/content/site-data.js";
import { renderPage, routeToOutputPath } from "../src/lib/render.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

async function ensureCleanDir(targetDir) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
}

async function copyPublicAssets(distDir) {
  const sourceDir = path.join(projectRoot, "public");
  const targetDir = path.join(distDir, "assets");
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

async function writePages(distDir) {
  const outputs = [];

  for (const page of siteData.pages) {
    const relativeOutputPath = routeToOutputPath(page.slug);
    const absoluteOutputPath = path.join(distDir, relativeOutputPath);
    await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await fs.writeFile(absoluteOutputPath, renderPage(page, siteData), "utf8");
    outputs.push(relativeOutputPath);
  }

  return outputs;
}

async function buildSite(targetDir = path.join(projectRoot, "dist")) {
  await ensureCleanDir(targetDir);
  await copyPublicAssets(targetDir);
  const pages = await writePages(targetDir);
  return { targetDir, pages };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildSite();
  console.log(`Built ${result.pages.length} pages into ${result.targetDir}`);
}

export { buildSite };
