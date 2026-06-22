import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

/**
 * Load and validate the site configuration from a YAML file.
 *
 * @param configPath - absolute or relative path to site-config.yaml
 * @returns the parsed config object (same shape as the old siteData)
 */
export function loadConfig(configPath?: string) {
  const resolvedPath = configPath ?? path.resolve(process.cwd(), "site-config.yaml");

  let raw: string;
  try {
    raw = fs.readFileSync(resolvedPath, "utf8");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot read config file "${resolvedPath}": ${msg}`);
  }

  let config: Record<string, unknown>;
  try {
    config = parseYaml(raw);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid YAML in "${resolvedPath}": ${msg}`);
  }

  if (config === null || typeof config !== "object") {
    throw new Error(`Config file "${resolvedPath}" must contain a YAML mapping at the top level.`);
  }

  // Lightweight structural validation — fail fast with a clear message
  const required = ["site", "nav", "footer", "form", "pages"];
  for (const key of required) {
    if (!(key in config)) {
      throw new Error(`Missing required key "${key}" in "${resolvedPath}".`);
    }
  }

  if (!Array.isArray(config.pages)) {
    throw new Error(`"pages" must be an array in "${resolvedPath}".`);
  }

  if (!Array.isArray(config.nav)) {
    throw new Error(`"nav" must be an array in "${resolvedPath}".`);
  }

  // Return as any — render.ts accepts whatever shape the config provides.
  // The renderer validates section types at render time.
  return config as Record<string, unknown>;
}