const NAV_SCROLL_OFFSET = 120;
const DEFAULT_LOCALE = "zh";

function updateNavToggleLabel(toggle) {
  const locale = document.documentElement.dataset.locale === "en" ? "en" : "zh";
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  const state = isOpen ? "close" : "open";
  const label = toggle.dataset[`nav${state[0].toUpperCase()}${state.slice(1)}Label${locale === "en" ? "En" : "Zh"}`];

  if (typeof label === "string") {
    toggle.setAttribute("aria-label", label);
  }
}

function applyLocale(locale) {
  document.documentElement.dataset.locale = locale;
  document.documentElement.lang = locale === "en" ? "en" : "zh-CN";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = element.dataset[locale];
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-locale-toggle]").forEach((button) => {
    button.textContent = locale === "zh" ? "EN" : "中文";
  });

  document.querySelectorAll("[data-nav-toggle]").forEach((toggle) => {
    updateNavToggleLabel(toggle);
  });
}

function setupLocaleSwitch() {
  const savedLocale = window.localStorage.getItem("site-locale") || DEFAULT_LOCALE;
  applyLocale(savedLocale);

  document.querySelectorAll("[data-locale-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLocale = document.documentElement.dataset.locale === "en" ? "zh" : "en";
      window.localStorage.setItem("site-locale", nextLocale);
      applyLocale(nextLocale);
    });
  });
}

function updateNavState(nav, hero) {
  if (!hero) {
    nav.dataset.state = "inner";
    return;
  }

  const threshold = hero.offsetHeight - NAV_SCROLL_OFFSET;
  nav.dataset.state = window.scrollY > threshold ? "scrolled" : "hero";
}

function setupNav() {
  const nav = document.querySelector("[data-site-nav]");
  if (!nav) {
    return;
  }

  const hero = document.querySelector("[data-hero]");
  const toggle = nav.querySelector("[data-nav-toggle]");
  const mobilePanel = nav.querySelector("[data-mobile-nav]");
  updateNavState(nav, hero);

  window.addEventListener("scroll", () => updateNavState(nav, hero), { passive: true });
  nav.addEventListener("mouseenter", () => {
    nav.dataset.hovered = "true";
  });
  nav.addEventListener("mouseleave", () => {
    nav.dataset.hovered = "false";
  });

  if (toggle && mobilePanel) {
    const closePanel = () => {
      toggle.setAttribute("aria-expanded", "false");
      mobilePanel.hidden = true;
      updateNavToggleLabel(toggle);
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
      mobilePanel.hidden = isOpen;
      updateNavToggleLabel(toggle);
    });

    updateNavToggleLabel(toggle);

    mobilePanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closePanel);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) {
        closePanel();
      }
    });
  }
}

const HERO_PARALLAX_START_RATIO = 1 / 3;
const HERO_PARALLAX_RATE = 0.5;
const HERO_PARALLAX_LERP = 0.18;

function setupHeroParallax() {
  const sticky = document.querySelector(".hero__sticky");
  if (!sticky) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    return;
  }

  let target = 0;
  let current = 0;
  let rafId = 0;
  let pinRange = window.innerHeight;
  let startOffset = window.innerHeight * HERO_PARALLAX_START_RATIO;
  let maxOffset = (pinRange - startOffset) * HERO_PARALLAX_RATE;

  const recalc = () => {
    pinRange = window.innerHeight;
    startOffset = window.innerHeight * HERO_PARALLAX_START_RATIO;
    maxOffset = (pinRange - startOffset) * HERO_PARALLAX_RATE;
    syncTarget();
  };

  const syncTarget = () => {
    const y = window.scrollY;
    if (y <= startOffset) {
      target = 0;
    } else if (y >= pinRange) {
      target = maxOffset;
    } else {
      target = (y - startOffset) * HERO_PARALLAX_RATE;
    }
  };

  const tick = () => {
    const delta = target - current;
    if (Math.abs(delta) < 0.05) {
      current = target;
      sticky.style.transform = `translate3d(0, ${-current.toFixed(2)}px, 0)`;
      rafId = 0;
      return;
    }
    current += delta * HERO_PARALLAX_LERP;
    sticky.style.transform = `translate3d(0, ${-current.toFixed(2)}px, 0)`;
    rafId = requestAnimationFrame(tick);
  };

  const schedule = () => {
    syncTarget();
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  };

  recalc();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", recalc);
}

function setupRevealAnimation() {
  const elements = [...document.querySelectorAll("[data-reveal]")];
  if (!elements.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  elements.forEach((element) => observer.observe(element));
}

function setupLeadForms() {
  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const locale = document.documentElement.dataset.locale === "en" ? "en" : "zh";

      if (!form.reportValidity()) {
        if (status) {
          status.textContent = form.dataset[`error${locale === "en" ? "En" : "Zh"}`];
          status.className = "form-status is-error";
        }
        return;
      }

      // Build mailto link
      const fd = new FormData(form);
      const name = fd.get("name") || "";
      const email = fd.get("email") || "";
      const industry = fd.get("industry") || "";
      const company = fd.get("company") || "";
      const phone = fd.get("phone") || "";
      const stage = fd.get("stage") || "";
      const market = fd.get("market") || "";
      const message = fd.get("message") || "";
      const needs = fd.getAll("needs").join(", ");

      const subject = `[Wilnes] Inquiry from ${name} (${company})`;
      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Industry: ${industry}`,
        `Company: ${company}`,
        `Phone: ${phone}`,
        `Stage: ${stage}`,
        `Target Market: ${market}`,
        `Needs: ${needs}`,
        `Message: ${message}`,
      ].join("\n");

      const mailtoUrl = `mailto:dmiao@laurentian.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      if (status) {
        status.textContent = form.dataset[`success${locale === "en" ? "En" : "Zh"}`];
        status.className = "form-status is-success";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLocaleSwitch();
  setupNav();
  setupHeroParallax();
  setupRevealAnimation();
  setupLeadForms();
});
