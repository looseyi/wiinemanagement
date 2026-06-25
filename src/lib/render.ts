import path from "node:path";

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ── helpers for bilingual text ──

interface Bilingual {
  zh: string;
  en: string;
}

function isBilingual(value: unknown): value is Bilingual {
  return typeof value === "object" && value !== null && "zh" in value && "en" in value;
}

/** Render bilingual text as a span with data-i18n attributes. Falls back to string. */
function i18n(value: string | Bilingual | null | undefined, tag = "span") {
  if (typeof value === "string") return escapeHtml(value);
  if (!value || typeof value !== "object") return escapeHtml(String(value ?? ""));
  return `<${tag} data-i18n data-zh="${escapeHtml(value.zh)}" data-en="${escapeHtml(value.en)}">${escapeHtml(value.zh)}</${tag}>`;
}

function i18nAttr(value: string | Bilingual, attrName: string) {
  if (typeof value === "string") return `${attrName}="${escapeHtml(value)}"`;
  return `${attrName}-zh="${escapeHtml(value.zh)}" ${attrName}-en="${escapeHtml(value.en)}"`;
}

// ── routing ──

function routeToOutputPath(slug: string) {
  if (!slug) return "index.html";
  return path.posix.join(slug, "index.html");
}

function hrefToOutputPath(href: string) {
  if (!href.startsWith("/")) return href;
  if (href === "/") return "index.html";
  const normalized = href.replace(/^\/+|\/+$/g, "");
  if (!normalized) return "index.html";
  return path.posix.join(normalized, "index.html");
}

function toRelativeHref(fromOutputPath: string | null, targetHref: string) {
  if (/^(mailto:|tel:|#|https?:)/.test(targetHref)) return targetHref;
  const fromDir = fromOutputPath ? path.posix.dirname(fromOutputPath) : "";
  const targetOutput = hrefToOutputPath(targetHref);
  let relativePath = path.posix.relative(fromDir, targetOutput);
  if (!relativePath) relativePath = "index.html";
  if (!relativePath.startsWith(".")) relativePath = `./${relativePath}`;
  return relativePath.replace(/\/index\.html$/, "/");
}

function assetHref(fromOutputPath: string | null, assetName: string) {
  const fromDir = fromOutputPath ? path.posix.dirname(fromOutputPath) : "";
  let relativePath = path.posix.relative(fromDir, path.posix.join("assets", assetName));
  if (!relativePath.startsWith(".")) relativePath = `./${relativePath}`;
  return relativePath;
}

// ── simple helpers ──

/** Map config theme to CSS class: light=gray, white=white-on-light, blue=blue */
function sectionClass(theme) {
  if (theme === "blue") return "section-blue section-variant-default";
  if (theme === "white") return "section-light section-variant-white";
  if (theme === "gray") return "section-light";
  return "section-light";
}

function renderButton(button, outputPath, variant = "primary") {
  const label = (typeof button.label === "object") ? button.label.zh : button.label;
  return `<a class="button button-${variant}" href="${escapeHtml(toRelativeHref(outputPath, button.href))}">${i18n(button.label)}</a>`;
}

function sectionIntro(section) {
  const eyebrow = section.eyebrow ? `<p class="eyebrow">${i18n(section.eyebrow)}</p>` : "";
  const title = section.title ? `<h2>${i18n(section.title)}</h2>` : "";
  return `<div class="mb-12 max-w-none lg:max-w-[40rem]" data-reveal>${eyebrow}${title}</div>`;
}

function sectionIntroWide(section) {
  const eyebrow = section.eyebrow ? `<p class="eyebrow">${i18n(section.eyebrow)}</p>` : "";
  const title = section.title ? `<h2 class="m-0 text-[clamp(1.95rem,4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.05em]">${i18n(section.title)}</h2>` : "";
  return `<div class="mb-10 max-w-none lg:max-w-[36rem]" data-reveal>${eyebrow}${title}</div>`;
}

// ── Nav ──

function renderNav(siteData, page, outputPath) {
  const navItems = siteData.nav.map((item) => {
    const isActive = item.href === `/${page.slug}/`.replace("//", "/") || (!page.slug && item.href === "/");
    return `<a class="nav-link${isActive ? " is-active" : ""}" href="${escapeHtml(toRelativeHref(outputPath, item.href))}">${i18n(item.label)}</a>`;
  }).join("");

  const mobileNavItems = siteData.nav.map((item) => {
    return `<a class="mobile-nav-link" href="${escapeHtml(toRelativeHref(outputPath, item.href))}">${i18n(item.label)}</a>`;
  }).join("");

  const ctaLabel = i18n(siteData.site.ctaLabel);

  return `
    <header class="site-header" data-site-nav data-state="${page.hero ? "hero" : "inner"}">
      <div class="site-header__shell">
        <a class="brand" href="${escapeHtml(toRelativeHref(outputPath, "/"))}">
          <span class="brand-mark" aria-hidden="true"></span>
          <span class="brand-text-group">
            <span class="brand-text">${escapeHtml(siteData.site.name)}</span>
            <span class="brand-slogan">${i18n(siteData.site.tagline)}</span>
          </span>
        </a>
        <nav class="site-nav hidden lg:flex" aria-label="Primary">${navItems}</nav>
        <div class="site-header__actions hidden lg:inline-flex">
          <button class="lang-switch" type="button" data-locale-toggle aria-label="Switch language">EN</button>
          <a class="button button-ghost" href="${escapeHtml(toRelativeHref(outputPath, "#inquiry"))}">${ctaLabel}</a>
        </div>
        <button
          class="mobile-nav-toggle lg:hidden"
          type="button"
          data-nav-toggle
          data-nav-open-label-zh="打开菜单"
          data-nav-open-label-en="Open menu"
          data-nav-close-label-zh="关闭菜单"
          data-nav-close-label-en="Close menu"
          aria-expanded="false"
          aria-controls="mobile-nav-panel"
          aria-label="Open menu"
        >
          <span class="mobile-nav-toggle__icon" aria-hidden="true">
            <span class="mobile-nav-toggle__bar"></span>
            <span class="mobile-nav-toggle__bar"></span>
          </span>
        </button>
      </div>
      <div id="mobile-nav-panel" class="mobile-nav-panel lg:hidden" data-mobile-nav hidden>
        <div class="mobile-nav-inner">
          <div class="mobile-nav-links">${mobileNavItems}</div>
          <div class="mobile-nav-actions">
            <button class="lang-switch" type="button" data-locale-toggle aria-label="Switch language">EN</button>
            <a class="button button-ghost mobile-nav-cta" href="${escapeHtml(toRelativeHref(outputPath, "#inquiry"))}">${ctaLabel}</a>
          </div>
        </div>
      </div>
    </header>
  `;
}

// ── Hero ──

function renderHero(hero, outputPath) {
  const whitepaperBtn = hero.whitepaperCta
    ? `<a class="button button-ghost" href="${escapeHtml(toRelativeHref(outputPath, hero.whitepaperCta.href))}">${i18n(hero.whitepaperCta.label)}</a>`
    : "";

  return `
    <section class="hero" data-hero>
      <div class="hero__sticky">
        <div class="hero__backdrop"></div>
        <div class="hero__content section-shell">
          <div class="hero__copy" data-reveal>
            <p class="eyebrow eyebrow-invert">${i18n(hero.eyebrow)}</p>
            <h1>${i18n(hero.title)}</h1>
            <div class="hero__supporting">
              <p class="hero__body">${i18n(hero.subtitle)}</p>
              <p class="hero__body">${i18n(hero.subtitle2)}</p>
              <div class="hero__actions">
                ${renderButton(hero.primaryCta, outputPath, "primary")}
                ${renderButton(hero.secondaryCta, outputPath, "secondary")}
                ${whitepaperBtn}
              </div>
            </div>
          </div>
        </div>
        <div class="hero__curtain" aria-hidden="true">
          <div class="hero__curtain-inner"></div>
        </div>
      </div>
    </section>
  `;
}

// ── Masthead ──

function renderMasthead(masthead) {
  return `
    <section class="masthead">
      <div class="section-shell">
        <p class="eyebrow eyebrow-invert">${i18n(masthead.eyebrow)}</p>
        <h1>${i18n(masthead.title)}</h1>
        ${masthead.body && masthead.body.zh ? `<p class="masthead__body">${i18n(masthead.body)}</p>` : ""}
      </div>
    </section>
  `;
}

// ── Who We Help ──

function renderWhoWeHelp(section) {
  const cards = section.groups.map((g) => `
      <article class="min-h-[260px] rounded-[26px] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.10)]" data-reveal>
        <h3 class="mt-0 mb-4 text-[clamp(1.65rem,2.2vw,2.25rem)] leading-[1.1] tracking-[-0.04em]">${i18n(g.title)}</h3>
        <p class="text-[--color-muted]">${i18n(g.subtitle)}</p>
        <p class="text-[--color-muted]">${i18n(g.description)}</p>
      </article>
    `).join("");

  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell grid items-center gap-12 lg:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)] xl:gap-16">
        ${sectionIntroWide(section)}
        <div class="grid gap-6 md:grid-cols-2 lg:-ml-6 lg:pt-6 xl:-ml-10">${cards}</div>
      </div>
    </section>
  `;
}

// ── Solutions Overview ──

function renderSolutionsOverview(section) {
  const groups = section.groups.map((g) => `
    <article class="min-h-[260px] rounded-[26px] bg-white/8 p-8 text-white" data-reveal>
      <h3 class="mt-0 mb-4 text-[clamp(1.65rem,2.2vw,2.25rem)] leading-[1.1] tracking-[-0.04em]">${i18n(g.title)}</h3>
      <ul class="ml-5 list-disc space-y-2.5 marker:text-white/90">
        ${g.items.map((item) => `<li class="text-white/82">${i18n(item)}</li>`).join("")}
      </ul>
    </article>
  `).join("");

  return `
    <section class="section section-blue section-variant-default">
      <div class="section-shell grid items-center gap-12 lg:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)] xl:gap-16">
        ${sectionIntroWide(section)}
        <div class="grid gap-6 md:grid-cols-2 lg:-ml-6 lg:pt-6 xl:-ml-10">${groups}</div>
      </div>
    </section>
  `;
}

// ── About CTA (kept for backward compat but not used on homepage) ──

function renderAboutCta(section) {
  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell grid items-center gap-12 lg:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)] xl:gap-16">
        ${sectionIntroWide(section)}
        <div class="lg:-ml-6 lg:pt-6 xl:-ml-10" data-reveal>
          <p class="text-[--color-muted] text-lg leading-relaxed">${i18n(section.body)}</p>
          <div class="mt-6">
            <a class="button button-primary" href="${escapeHtml(toRelativeHref(null, section.ctaHref))}">${i18n(section.ctaLabel)}</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ── Solution Detail ──

function renderSolutionDetail(section) {
  const cards = section.cards.map((card) => {
    const services = card.services.map((s) => `<li>${i18n(s)}</li>`).join("");
    return `
    <article class="min-h-[260px] rounded-[26px] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.10)]" data-reveal>
      <p class="mb-4 font-[var(--font-serif)] text-[2.6rem] leading-none text-[--color-brand]">${escapeHtml(card.number)}</p>
      <h3 class="mt-0 mb-4 text-[clamp(1.65rem,2.2vw,2.25rem)] leading-[1.1] tracking-[-0.04em]">${i18n(card.title)}</h3>
      <p class="text-[--color-muted] font-semibold mb-2">${i18n(card.suitable)}</p>
      <ul class="ml-5 list-disc space-y-2 text-[--color-muted]">${services}</ul>
    </article>
    `;
  }).join("");

  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell">
        ${section.eyebrow || section.title ? sectionIntroWide(section) : ""}
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">${cards}</div>
      </div>
    </section>
  `;
}

function cardClasses(theme) {
  if (theme === "blue") {
    return { article: "min-h-[260px] rounded-[26px] bg-white/8 p-8 text-white", muted: "text-white/82", markerMuted: "marker:text-white/90" };
  }
  return { article: "min-h-[260px] rounded-[26px] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.10)]", muted: "text-[--color-muted]", markerMuted: "marker:text-[--color-brand]" };
}

function renderIndustriesGrid(section) {
  const cls = cardClasses(section.theme);
  const groups = section.groups.map((g) => `
    <article class="${cls.article}" data-reveal>
      <h3 class="mt-0 mb-4 text-[clamp(1.65rem,2.2vw,2.25rem)] leading-[1.1] tracking-[-0.04em]">${i18n(g.title)}</h3>
      <ul class="ml-5 list-disc space-y-2.5 ${cls.muted}">
        ${g.items.map((item) => `<li>${i18n(item)}</li>`).join("")}
      </ul>
    </article>
  `).join("");

  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell">
        ${section.eyebrow || section.title ? sectionIntroWide(section) : ""}
        <div class="grid gap-6 md:grid-cols-2">${groups}</div>
      </div>
    </section>
  `;
}

// ── Case Studies Grid ──

function renderCaseStudiesGrid(section, outputPath) {
  const cards = section.cards.map((card) => {
    const href = card.href || "#";
    const isLink = href.startsWith("/");
    const cardInner = `
      <h3 class="mt-0 mb-4 text-[clamp(1.65rem,2.2vw,2.25rem)] leading-[1.1] tracking-[-0.04em]">${i18n(card.title)}</h3>
      <p class="text-[--color-muted]">${i18n(card.body)}</p>
    `;
    if (isLink) {
      return `
        <a href="${escapeHtml(toRelativeHref(outputPath, href))}" class="min-h-[180px] rounded-[26px] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.10)] block transition hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(15,23,42,0.14)]" data-reveal>
          ${cardInner}
        </a>
      `;
    }
    return `
      <article class="min-h-[180px] rounded-[26px] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.10)]" data-reveal>
        ${cardInner}
      </article>
    `;
  }).join("");

  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell">
        ${section.eyebrow || section.title ? sectionIntroWide(section) : ""}
        <div class="grid gap-6 md:grid-cols-2">${cards}</div>
      </div>
    </section>
  `;
}

// ── About Detail ──

function renderAboutDetail(section, outputPath) {
  const cls = cardClasses(section.theme);
  const mutedClass = section.theme === "blue" ? "text-white/82" : "text-[--color-muted]";
  const bodyClass = section.theme === "blue" ? "text-white/82" : "text-[--color-muted]";

  let missionHtml = "";
  if (section.mission) {
    missionHtml = `
      <div class="section ${section.theme === "blue" ? "section-blue section-variant-default" : "section-light section-variant-white"} rounded-[26px] p-8 lg:p-10" data-reveal>
        <h2 class="m-0 mb-4 text-[clamp(1.65rem,3vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.04em]">${i18n(section.mission.title)}</h2>
        <p class="${bodyClass} text-lg leading-relaxed max-w-3xl">${i18n(section.mission.body)}</p>
      </div>
    `;
  }

  let teamHtml = "";
  if (section.team && section.team.members) {
    const members = section.team.members.map((m) => {
      const photoHtml = m.photo
        ? `<img class="team-photo" src="${escapeHtml(assetHref(outputPath, m.photo))}" alt="${escapeHtml(m.name)}" loading="lazy">`
        : `<div class="team-photo-placeholder"></div>`;
      return `
        <article class="team-member" data-reveal>
          <div class="team-photo-wrap">${photoHtml}</div>
          <div class="team-info">
            <h3 class="team-name">${escapeHtml(m.name)}</h3>
            <p class="team-role">${i18n(m.role)}</p>
            <p class="team-bio ${mutedClass}">${i18n(m.bio)}</p>
          </div>
        </article>
      `;
    }).join("");
    teamHtml = `
      <div>
        <div class="mb-10" data-reveal>
          ${section.team.eyebrow ? `<p class="eyebrow ${section.theme === "blue" ? "eyebrow-invert" : ""}">${i18n(section.team.eyebrow)}</p>` : ""}
          <h2 class="m-0 text-[clamp(1.95rem,4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.05em]">${i18n(section.team.title)}</h2>
        </div>
        <div class="team-grid">${members}</div>
      </div>
    `;
  }

  const whyUs = (section.whyUs || []).map((item) => `<li class="${mutedClass}">${i18n(item)}</li>`).join("");

  let whyUsHtml = "";
  if (whyUs) {
    whyUsHtml = `
      <div>
        <h2 class="m-0 mb-6 text-[clamp(1.95rem,4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.05em]" data-reveal>${i18n({ zh: "为什么选择我们", en: "Why Work With Us" })}</h2>
        <ul class="ml-5 list-disc space-y-2.5">${whyUs}</ul>
      </div>
    `;
  }

  let ctaBox = "";
  if (section.ctaTitle) {
    ctaBox = `
      <div class="section section-blue section-variant-default rounded-[26px] p-8" data-reveal>
        <h2 class="m-0 mb-4 text-[clamp(1.95rem,4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.05em]">${i18n(section.ctaTitle)}</h2>
        <p class="text-white/82 mb-6">${i18n(section.ctaBody)}</p>
        <a class="button button-secondary" href="${escapeHtml(toRelativeHref(outputPath, section.ctaHref))}">${i18n(section.ctaLabel)}</a>
      </div>
    `;
  }

  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell space-y-12">
        <div data-reveal>
          <p class="${bodyClass} text-lg leading-relaxed max-w-3xl">${i18n(section.body)}</p>
        </div>
        ${missionHtml}
        ${teamHtml}
        ${whyUsHtml}
        ${ctaBox}
      </div>
    </section>
  `;
}

// ── FAQ ──

function renderFaq(section) {
  const items = section.items.map((item, index) => `
    <details class="faq-item" data-reveal>
      <summary class="faq-question">
        <span>${i18n(item.question)}</span>
        <span class="faq-icon" aria-hidden="true"></span>
      </summary>
      <div class="faq-answer">
        <p>${i18n(item.answer)}</p>
      </div>
    </details>
  `).join("");

  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell">
        ${sectionIntroWide(section)}
        <div class="faq-list">${items}</div>
      </div>
    </section>
  `;
}

// ── Case Study Detail ──

function renderCaseStudyDetail(section) {
  return `
    <section class="section ${sectionClass(section.theme)}">
      <div class="section-shell" data-reveal>
        <p class="text-[--color-muted] text-lg leading-relaxed">${i18n(section.body)}</p>
      </div>
    </section>
  `;
}

// ── Form ──

function renderInquiryForm(siteData) {
  const stageOptions = siteData.form.fields.stageOptions
    .map((o) => `<option value="${escapeHtml(o.zh)}">${i18n(o)}</option>`).join("");
  const marketOptions = siteData.form.fields.marketOptions
    .map((o) => `<option value="${escapeHtml(o.zh)}">${i18n(o)}</option>`).join("");
  const needOptions = siteData.form.fields.needOptions
    .map((o, i) => `
      <label class="grid min-w-0 self-start grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3 rounded-[20px] border border-black/10 bg-[#f0f5fc] px-4 py-3">
        <input class="checkbox-input" type="checkbox" name="needs" value="${escapeHtml(o.zh)}" ${i === 0 ? "checked" : ""}>
        <span class="block text-sm leading-5 text-[--color-ink]">${i18n(o)}</span>
      </label>
    `).join("");

  const formTitle = i18n(siteData.form.title);
  const formSubtitle = i18n(siteData.form.subtitle);
  const successZh = escapeHtml(siteData.form.successMessage.zh);
  const successEn = escapeHtml(siteData.form.successMessage.en);

  return `
    <section id="inquiry" class="section section-form">
      <div class="section-shell grid items-start gap-10 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)]">
        <div data-reveal>
          <h2 class="m-0 text-[clamp(1.95rem,4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.05em]">${formTitle}</h2>
          <p class="text-[--color-muted]">${formSubtitle}</p>
          <div class="mt-7 grid gap-4">
            <div>
              <strong>${i18n({ zh: "微信快捷咨询", en: "WeChat" })}</strong>
              <span class="text-[--color-muted]">${escapeHtml(siteData.site.contact.wechat)}</span>
            </div>
            <div>
              <strong>${i18n({ zh: "咨询热线", en: "Phone" })}</strong>
              <span class="text-[--color-muted]">${escapeHtml(siteData.site.contact.phone)}</span>
            </div>
            <div>
              <strong>${i18n({ zh: "官方邮箱", en: "Email" })}</strong>
              <span class="text-[--color-muted]">${escapeHtml(siteData.site.contact.email)}</span>
            </div>
          </div>
        </div>
        <form class="rounded-[26px] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.10)] sm:p-7"
              data-lead-form novalidate
              data-success-zh="${successZh}" data-success-en="${successEn}"
              data-error-zh="请先完整填写必填字段。" data-error-en="Please complete the required fields first."
              data-reveal>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2">
              <span>${i18n({ zh: "您的姓名 *", en: "Your name *" })}</span>
              <input class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px]" name="name" type="text" required>
            </label>
            <label class="grid gap-2">
              <span>${i18n({ zh: "您的邮箱地址 *", en: "Your email *" })}</span>
              <input class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px]" name="email" type="email" required>
            </label>
            <label class="grid gap-2">
              <span>${i18n({ zh: "行业名称", en: "Industry" })}</span>
              <input class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px]" name="industry" type="text">
            </label>
            <label class="grid gap-2">
              <span>${i18n({ zh: "公司名称 *", en: "Company *" })}</span>
              <input class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px]" name="company" type="text" required>
            </label>
            <label class="grid gap-2">
              <span>${i18n({ zh: "您的联系电话 *", en: "Phone *" })}</span>
              <input class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px]" name="phone" type="tel" required>
            </label>
            <label class="grid gap-2">
              <span>${i18n({ zh: "目前阶段", en: "Current stage" })}</span>
              <select class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px]" name="stage">${stageOptions}</select>
            </label>
            <label class="grid gap-2">
              <span>${i18n({ zh: "预计进入市场", en: "Target market" })}</span>
              <select class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px]" name="market">${marketOptions}</select>
            </label>
            <label class="grid gap-2 md:col-span-2">
              <span>${i18n({ zh: "补充说明", en: "Additional details" })}</span>
              <textarea class="w-full rounded-[18px] border border-black/10 bg-[#f8fbff] px-3.5 py-3 min-h-[50px] min-h-[128px] resize-y" name="message" rows="4"></textarea>
            </label>
            <fieldset class="grid gap-2 md:col-span-2">
              <legend>${i18n({ zh: "核心需求", en: "Core needs" })}</legend>
              <div class="grid items-start gap-3 md:grid-cols-2">${needOptions}</div>
            </fieldset>
          </div>
          <div class="mt-5 flex flex-wrap items-center gap-4">
            <button class="button button-primary" type="submit">
              ${i18n({ zh: "提交咨询需求", en: "Submit inquiry" })}
            </button>
            <p class="form-note">${i18n({ zh: "当前版本为静态演示站点，提交后仅展示前端成功状态。", en: "This version is a static demo. Submission currently shows a front-end success state only." })}</p>
          </div>
          <p class="form-status" data-form-status aria-live="polite"></p>
        </form>
      </div>
    </section>
  `;
}

// ── Footer ──

function renderFooter(siteData, outputPath) {
  const columns = siteData.footer.columns.map((col) => `
    <div class="space-y-4" data-reveal>
      <h3>${i18n(col.heading)}</h3>
      <ul class="m-0 list-none p-0">
        ${col.links.map((link) => `<li class="mt-2.5 first:mt-0"><a class="text-white/76" href="${escapeHtml(toRelativeHref(outputPath, link.href))}">${i18n(link.label)}</a></li>`).join("")}
      </ul>
    </div>
  `).join("");

  const contactCol = `
    <div class="space-y-4" data-reveal>
      <h3>${i18n({ zh: "联系信息", en: "Contact" })}</h3>
      <ul class="footer-contact-list">
        <li class="footer-contact-item">
          <strong class="footer-contact-label">${i18n({ zh: "微信快捷咨询", en: "WeChat" })}</strong>
          <span class="text-white/76">${escapeHtml(siteData.site.contact.wechat)}</span>
        </li>
        <li class="footer-contact-item">
          <strong class="footer-contact-label">${i18n({ zh: "咨询热线", en: "Phone" })}</strong>
          <span class="text-white/76">${escapeHtml(siteData.site.contact.phone)}</span>
        </li>
        <li class="footer-contact-item">
          <strong class="footer-contact-label">${i18n({ zh: "官方邮箱", en: "Email" })}</strong>
          <a class="text-white/76" href="mailto:${escapeHtml(siteData.site.contact.email)}">${escapeHtml(siteData.site.contact.email)}</a>
        </li>
      </ul>
    </div>
  `;

  const tagline = i18n(siteData.site.tagline);
  const socialLinks = siteData.site.socialLinks.map((item) =>
    `<a class="text-white/76" href="${escapeHtml(toRelativeHref(outputPath, item.href))}">${i18n(item.label)}</a>`
  ).join("");

  const copyright = siteData.footer.copyright || `© 2026 ${escapeHtml(siteData.site.legalName || siteData.site.name)}. All rights reserved.`;

  return `
    <footer class="site-footer">
      <div class="site-footer__cta section-shell" data-reveal>
        <h2>${i18n(siteData.footer.title)}</h2>
        <a class="button button-secondary footer-cta-button" href="${escapeHtml(toRelativeHref(outputPath, "#inquiry"))}">${i18n(siteData.footer.ctaLabel)}</a>
      </div>
      <div class="section-shell grid gap-10 pt-10 lg:grid-cols-[minmax(280px,1.05fr)_minmax(0,1.25fr)]">
        <div class="footer-brand-column">
          <div class="space-y-4" data-reveal>
            <a class="brand brand-footer" href="${escapeHtml(toRelativeHref(outputPath, "/"))}">
              <span class="brand-mark" aria-hidden="true"></span>
              <span class="brand-text">${escapeHtml(siteData.site.name)}</span>
            </a>
            <p class="text-white/76">${tagline}</p>
            <div class="flex flex-wrap gap-3.5">${socialLinks}</div>
          </div>
          <div class="footer-qr-card" data-reveal>
            <img class="footer-qr-image" src="${assetHref(outputPath, "wx.jpg")}" alt="WeChat QR Code">
          </div>
        </div>
        <div class="footer-links-grid">${columns}${contactCol}</div>
      </div>
      <div class="section-shell mt-8 border-t border-white/14 pt-6" data-reveal>
        <p class="footer-copyright">${escapeHtml(copyright)}</p>
      </div>
    </footer>
  `;
}

// ── Section dispatch ──

function renderSection(section, outputPath) {
  switch (section.type) {
    case "who-we-help":
      return renderWhoWeHelp(section);
    case "solutions-overview":
      return renderSolutionsOverview(section);
    case "about-cta":
      return renderAboutCta(section);
    case "solution-detail":
      return renderSolutionDetail(section);
    case "industries-grid":
      return renderIndustriesGrid(section);
    case "case-studies-grid":
      return renderCaseStudiesGrid(section, outputPath);
    case "about-detail":
      return renderAboutDetail(section, outputPath);
    case "faq":
      return renderFaq(section);
    case "case-study-detail":
      return renderCaseStudyDetail(section);
    default:
      throw new Error(`Unknown section type: ${section.type}`);
  }
}

// ── Page render ──

function renderPage(page, siteData) {
  const outputPath = routeToOutputPath(page.slug);
  const pageHeader = page.hero ? renderHero(page.hero, outputPath) : renderMasthead(page.masthead);

  let pageBody;
  if (page.hero && page.sections.length > 0) {
    const [firstSection, ...restSections] = page.sections;
    const firstHtml = renderSection(firstSection, outputPath);
    const restHtml = restSections.map((s) => renderSection(s, outputPath)).join("");
    pageBody = `
      <div class="section-execution-canvas">
        ${firstHtml}
      </div>
      ${restHtml}`;
  } else {
    pageBody = page.sections.map((s) => renderSection(s, outputPath)).join("");
  }

  const titleZh = escapeHtml(typeof page.title === "object" ? page.title.zh : page.title);
  const descZh = escapeHtml(typeof page.description === "object" ? page.description.zh : page.description);

  return `<!doctype html>
<html lang="zh-CN" data-locale="zh">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${titleZh} | ${escapeHtml(siteData.site.name)}</title>
    <meta name="description" content="${descZh}">
    <link rel="stylesheet" href="${escapeHtml(assetHref(outputPath, "styles.css"))}">
    <script defer src="${escapeHtml(assetHref(outputPath, "site.js"))}"></script>
    <noscript><style>[data-reveal]{opacity:1!important;transform:none!important}</style></noscript>
  </head>
  <body data-page="${escapeHtml(page.slug || "home")}">
    ${renderNav(siteData, page, outputPath)}
    <main>
      ${pageHeader}
      ${pageBody}
      ${renderInquiryForm(siteData)}
    </main>
    ${renderFooter(siteData, outputPath)}
  </body>
</html>`;
}

export {
  assetHref,
  escapeHtml,
  renderPage,
  routeToOutputPath,
  toRelativeHref
};
