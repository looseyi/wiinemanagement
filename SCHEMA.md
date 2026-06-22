# Site Config Schema

Edit `site-config.yaml` to customize the entire website. Every text field supports bilingual `zh`/`en` keys. Set `en: ""` for fields that don't need English text. Run `npm run build` after changes.

## Top-level Structure

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `site` | object | yes | Company name, tagline, contact info, social links |
| `nav` | array | yes | Navigation bar items (6 typical) |
| `footer` | object | yes | Footer CTA, column links |
| `form` | object | yes | Contact form fields and messages |
| `pages` | array | yes | Page definitions (homepage + sub-pages) |

## `site` (Site Metadata)

```yaml
site:
  name: string             # Company name, shown in nav/footer/title
  tagline:                  # Footer tagline
    zh: string
    en: string
  languageLabel: string     # Shown in nav (e.g. "EN / 中文")
  ctaLabel:                 # Nav CTA button text
    zh: string
    en: string
  ctaHref: string          # CTA link target (e.g. "#inquiry")
  contact:
    phone: string
    email: string
    wechat: string
  socialLinks:
    - label: { zh: string, en: string }
      href: string
```

## `nav` (Navigation)

Array of nav items. The first item with `href: "/"` is the homepage. Active state is auto-detected by URL match.

```yaml
nav:
  - label: { zh: 首页, en: Home }
    href: "/"
  - label: { zh: 解决方案, en: Solutions }
    href: "/solutions/"
  # ... more items
```

## `footer` (Footer)

```yaml
footer:
  title: { zh: string, en: string }   # CTA heading
  ctaLabel: { zh: string, en: string } # CTA button
  columns:
    - heading: { zh: string, en: string }
      links:
        - label: { zh: string, en: string }
          href: string
```

## `form` (Contact Form)

```yaml
form:
  title: { zh: string, en: string }
  subtitle: { zh: string, en: string }
  successMessage: { zh: string, en: string }
  fields:
    stageOptions:                       # Dropdown: current stage
      - { zh: string, en: string }
    marketOptions:                      # Dropdown: target market
      - { zh: string, en: string }
    needOptions:                        # Checkboxes: core needs
      - { zh: string, en: string }
```

## `pages` (Page Definitions)

Each page has:

```yaml
pages:
  - slug: ""                  # Homepage (empty string)
    title: { zh: string, en: string }
    description: { zh: string, en: string }  # <meta description>
    hero: ...                 # Hero section (homepage only)
    masthead: ...             # Sub-page header (non-homepage)
    sections: [...]           # Content sections
```

### Page Section Types

Each section has `type`, `theme` ("light" or "blue"), and type-specific fields.

#### `who-we-help` — Customer audience cards

```yaml
- type: who-we-help
  theme: light
  eyebrow: { zh: string, en: string }
  title: { zh: string, en: string }
  groups:
    - title: { zh: string, en: string }
      subtitle: { zh: string, en: string }
      description: { zh: string, en: string }
```

#### `solutions-overview` — Solutions with bullet lists

```yaml
- type: solutions-overview
  theme: blue
  eyebrow: { zh: string, en: string }
  title: { zh: string, en: string }
  groups:
    - title: { zh: string, en: string }
      items:
        - { zh: string, en: string }
```

#### `about-cta` — About text + CTA button

```yaml
- type: about-cta
  theme: light
  eyebrow: { zh: string, en: string }
  title: { zh: string, en: string }
  body: { zh: string, en: string }
  ctaLabel: { zh: string, en: string }
  ctaHref: string
```

#### `solution-detail` — Numbered solution cards (Solutions page)

```yaml
- type: solution-detail
  theme: light
  cards:
    - number: "01"
      title: { zh: string, en: string }
      suitable: { zh: string, en: string }
      services:
        - { zh: string, en: string }
```

#### `industries-grid` — Industry category cards

```yaml
- type: industries-grid
  theme: light
  groups:
    - title: { zh: string, en: string }
      items:
        - { zh: string, en: string }
```

#### `case-studies-grid` — Case study cards

```yaml
- type: case-studies-grid
  theme: light
  cards:
    - title: { zh: string, en: string }
      body: { zh: string, en: string }
```

#### `about-detail` — Full about page with all subsections

```yaml
- type: about-detail
  theme: light
  body: { zh: string, en: string }
  whatWeDo:
    - title: { zh: string, en: string }
      body: { zh: string, en: string }
  whoWeWorkWith:
    - { zh: string, en: string }
  whyUs:
    - zh: string
      en: string
  ctaTitle: { zh: string, en: string }
  ctaBody: { zh: string, en: string }
  ctaLabel: { zh: string, en: string }
  ctaHref: string
```

## Adding a New Page

1. Add a new entry to `pages:` in `site-config.yaml` with a unique `slug`
2. Add a `nav:` entry so users can navigate to it
3. Run `npm run build`

## Customizing Colors & Fonts

Edit `src/styles/site.css`. Key CSS custom properties:

| Variable | Purpose |
|----------|---------|
| `--color-canvas` | Page background |
| `--color-ink` | Body text color |
| `--color-muted` | Secondary text |
| `--color-brand` | Buttons, accents |
| `--color-hero` | Hero overlay |
| `--font-sans` | Body font stack |
| `--font-serif` | Serif accent font |

## Adding a New Section Type

1. Add the new `type` to `pages[].sections[]` in `site-config.yaml`
2. Add a `case` handler in `src/lib/render.ts` → `renderSection()`
3. Write the HTML template function (follow existing patterns — use `i18n()` for bilingual text)