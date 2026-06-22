# Bilingual Static Site Template

A configurable static site generator for bilingual (Chinese/English) company websites. Edit a single YAML file, run one command, deploy to GitHub Pages.

## Quick Start

```bash
npm install
# Edit site-config.yaml with your company info
npm run build       # outputs to dist/
npm run serve       # preview at http://127.0.0.1:4173
```

## How It Works

1. **`site-config.yaml`** — All your site content (company name, nav, pages, form fields)
2. **`src/lib/render.ts`** — Template engine that reads the config and produces HTML
3. **`npm run build`** — Generates static HTML/CSS/JS into `dist/`
4. **Deploy `dist/`** to GitHub Pages (commit to `docs/` or use GitHub Actions)

## Customizing

1. Edit `site-config.yaml` — change company name, nav items, page content, contact info
2. Edit `src/styles/site.css` — change colors, fonts, spacing
3. Add new pages by adding entries to `site-config.yaml` → `pages:` and `nav:`
4. Add new section types by extending `src/lib/render.ts`

See [SCHEMA.md](SCHEMA.md) for the full config reference.

## Features

- Bilingual zh/en with runtime locale switcher
- Responsive design (mobile nav, parallax hero)
- 7 section types: who-we-help, solutions-overview, solution-detail, industries-grid, case-studies-grid, about-cta, about-detail
- Contact form with client-side validation
- Tailwind CSS v4 styling
- Zero runtime dependencies — pure static HTML output

## GitHub Pages Deployment

**Option A — docs/ folder (simplest):**
```bash
npm run build
cp -r dist/* docs/
git add docs/ && git commit -m "deploy" && git push
```
Set GitHub Pages source to `/docs` in repo settings.

**Option B — GitHub Actions:**
Create `.github/workflows/deploy.yml` that runs `npm ci && npm run build` and deploys `dist/` to the `gh-pages` branch.

## Project Structure

```
site-config.yaml          # ← YOU EDIT THIS
src/
  content/
    site-data.ts          # loads config
    load-config.ts        # YAML parser + validation
  lib/
    render.ts             # HTML template engine
  styles/
    site.css              # Tailwind + custom styles
scripts/
  build-site.ts           # build pipeline
  serve-site.ts           # dev server
public/
  site.js                 # locale switcher + nav + form JS
dist/                     # ← built output (deploy this)
```