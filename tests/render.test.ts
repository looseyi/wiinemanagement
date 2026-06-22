import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildSite } from "../scripts/build-site.ts";
import { siteData } from "../src/content/site-data.ts";
import { escapeHtml, renderPage, routeToOutputPath, toRelativeHref } from "../src/lib/render.ts";

test("escapeHtml protects rendered markup", () => {
  assert.equal(escapeHtml(`<script>alert("x")</script>`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
});

test("relative links keep explicit index.html targets for static file navigation", () => {
  assert.equal(toRelativeHref("about/index.html", "/"), "../index.html");
  assert.equal(toRelativeHref("about/index.html", "/solutions/"), "../solutions/index.html");
  assert.equal(toRelativeHref("index.html", "/about/"), "./about/index.html");
});

test("renderPage includes locale toggle, reveal hooks, inquiry form, and footer", () => {
  const html = renderPage(siteData.pages[0]);

  assert.match(html, /data-site-nav/);
  assert.match(html, /href="#inquiry"><span data-i18n data-zh="解决方案" data-en="Solutions"/);
  assert.match(html, /data-locale-toggle/);
  assert.match(html, /data-nav-toggle/);
  assert.match(html, /data-nav-open-label-zh="打开菜单"/);
  assert.match(html, /data-nav-close-label-en="Close menu"/);
  assert.match(html, /mobile-nav-toggle__icon/);
  assert.doesNotMatch(html, /hero__visual/);
  assert.match(html, /hero__sticky/);
  assert.match(html, /hero__supporting/);
  assert.match(html, /execution-canvas__content/);
  assert.match(html, /section-blue section-variant-default/);
  assert.match(html, /section-light section-variant-white/);
  assert.match(html, /Contact us/);
  assert.match(html, /footer-links-grid/);
  assert.match(html, /footer-qr-card/);
  assert.match(html, /Drop your WeChat QR image here later\./);
  assert.match(html, /data-reveal/);
  assert.match(html, /id="inquiry"/);
  assert.match(html, /Submit inquiry/);
  assert.match(html, /Ready to transform your North American expansion\?/);
  assert.match(html, /联系信息/);
  assert.match(html, /hello@wilnemanagement\.com/);
});

test("buildSite writes all pages and compiled assets", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "demo-site-"));
  const result = await buildSite(tempDir);

  assert.equal(result.pages.length, siteData.pages.length);

  const outputs = [
    "index.html",
    "solutions/index.html",
    "service-areas/index.html",
    "about/index.html",
    "insights/index.html",
    "assets/styles.css",
    "assets/site.js",
    "assets/hero-abstract.svg",
    "assets/about-abstract.svg"
  ];

  for (const relativeFile of outputs) {
    await assert.doesNotReject(fs.access(path.join(tempDir, relativeFile)));
  }

  const homepageHtml = await fs.readFile(path.join(tempDir, routeToOutputPath("")), "utf8");
  assert.match(homepageHtml, /execution-canvas__metrics/);
  assert.match(homepageHtml, /section-execution-canvas/);
  assert.match(homepageHtml, /footer-links-grid/);
  assert.match(homepageHtml, /footer-qr-card/);
  assert.match(homepageHtml, /data-en=/);
});
