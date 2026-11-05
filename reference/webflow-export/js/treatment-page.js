/**
 * Hydrates treatment-page.html from /content/treatment-pages/{category}/{slug}.json
 */
(function () {
  var match = window.location.pathname.match(
    /^\/(problem|behandlingar|plastikkirurgi)\/([^/]+)\/?$/
  );
  if (!match) return;

  var category = match[1];
  var slug = match[2];
  var url =
    "/content/treatment-pages/" + category + "/" + slug + ".json";

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $all(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function setSectionVisible(key, enabled) {
    $all('[data-vivaci-section="' + key + '"]').forEach(function (el) {
      el.hidden = !enabled;
    });
  }

  function setText(el, text) {
    if (!el || text == null) return;
    el.textContent = text;
  }

  function setCta(link, cta) {
    if (!link || !cta) return;
    if (cta.href) link.setAttribute("href", cta.href);
    if (!cta.label) return;
    var labelEl = link.querySelector("div:not([class*='icon-embed'])");
    if (labelEl) setText(labelEl, cta.label);
    else setText(link, cta.label);
  }

  var DEFAULT_BOOKING_CTAS = {
    primaryCta: { label: "Boka gratis konsultation", href: "/kontakt" },
    secondaryCta: { label: "Boka behandling", href: "/kontakt" },
  };

  function applyCtaBlock(sectionKey, cfg, fields) {
    var sec = $('[data-vivaci-section="' + sectionKey + '"]');
    if (!sec || !cfg) return;
    if (!shouldShowSection(sectionKey, cfg)) {
      setSectionVisible(sectionKey, false);
      return;
    }
    setSectionVisible(sectionKey, true);
    if (fields.heading) setText($(fields.heading, sec), cfg.heading);
    if (fields.intro) setText($(fields.intro, sec), cfg.intro);
    if (fields.primary) {
      setCta(
        $(fields.primary, sec),
        cfg.primaryCta || DEFAULT_BOOKING_CTAS.primaryCta
      );
    }
    if (fields.secondary) {
      setCta(
        $(fields.secondary, sec),
        cfg.secondaryCta || DEFAULT_BOOKING_CTAS.secondaryCta
      );
    }
  }

  function setHtmlParagraphs(el, text) {
    if (!el || !text) return;
    var parts = String(text).split(/\n\n+/).filter(Boolean);
    el.innerHTML = parts.map(function (p) {
      return "<p class=\"text-size-regular text-style-muted\">" + escapeHtml(p) + "</p>";
    }).join("");
  }

  /** Lines like "1. Markering…" from Railway ingreppssteg / process copy. */
  function parseNumberedSteps(body) {
    if (!body) return null;
    var parts = String(body).split(/\n\n+/).filter(Boolean);
    if (parts.length < 2) return null;
    var steps = [];
    for (var i = 0; i < parts.length; i++) {
      var m = parts[i].match(/^\s*(\d+)[.)]\s+([\s\S]+)$/);
      if (!m) return null;
      steps.push({ num: m[1], text: m[2].trim() });
    }
    return steps.length ? steps : null;
  }

  function normalizeHowSteps(how) {
    if (how.steps && how.steps.length) {
      return how.steps.map(function (item, idx) {
        var title = (item.title || "").trim();
        var body = (item.body || "").trim();
        var text = title && body ? title + " — " + body : title || body;
        return { num: String(idx + 1), text: text };
      });
    }
    return parseNumberedSteps(how.body);
  }

  function renderHowBullets(listEl, steps) {
    if (!listEl || !steps || !steps.length) return;
    listEl.innerHTML = steps
      .map(function (step) {
        return (
          '<li class="text-size-regular text-style-muted">' +
          escapeHtml(step.text) +
          "</li>"
        );
      })
      .join("");
    listEl.hidden = false;
  }

  function applyHowItWorksSection(how, howSec) {
    if (!howSec) return;
    var proseEl =
      $('[data-vivaci-field="how-prose"]', howSec) ||
      howSec.querySelector("[data-vivaci-block-body]");
    var stepsEl = $('[data-vivaci-field="how-steps"]', howSec);
    var steps = normalizeHowSteps(how || {});

    if (steps && steps.length && stepsEl) {
      if (proseEl) proseEl.hidden = true;
      renderHowBullets(stepsEl, steps);
    } else {
      if (stepsEl) {
        stepsEl.hidden = true;
        stepsEl.innerHTML = "";
      }
      if (proseEl) {
        proseEl.hidden = false;
        if (how.body) setHtmlParagraphs(proseEl, how.body);
      }
    }
  }

  var READ_MORE_MAX_LINES = 6;
  var READ_MORE_DURATION_MS = 420;
  var READ_MORE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  function readMoreLineHeight(content) {
    var probe = content.querySelector("p") || content;
    var lh = parseFloat(window.getComputedStyle(probe).lineHeight);
    if (!isNaN(lh) && lh > 0) return lh;
    var fs = parseFloat(window.getComputedStyle(probe).fontSize) || 16;
    return fs * 1.5;
  }

  function readMoreCollapsedHeight(content) {
    return readMoreLineHeight(content) * READ_MORE_MAX_LINES;
  }

  function clearReadMoreTransition(content) {
    content.style.transition = "";
    delete content.dataset.vivaciReadMoreAnimating;
  }

  function setReadMoreExpanded(content, toggle, label, icon, expanded, animate) {
    var collapsedH = readMoreCollapsedHeight(content);
    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var useMotion = animate && !prefersReduced;

    if (label) label.textContent = expanded ? "Visa mindre" : "Visa mer";
    if (toggle) toggle.setAttribute("aria-expanded", expanded ? "true" : "false");

    if (!useMotion) {
      clearReadMoreTransition(content);
      if (expanded) {
        content.classList.remove("is-truncated");
        content.classList.add("is-expanded");
        content.style.maxHeight = "none";
        content.style.overflow = "visible";
      } else {
        content.classList.add("is-truncated");
        content.classList.remove("is-expanded");
        content.style.maxHeight = collapsedH + "px";
        content.style.overflow = "hidden";
      }
      return;
    }

    if (content.dataset.vivaciReadMoreAnimating === "1") return;
    content.dataset.vivaciReadMoreAnimating = "1";
    content.style.overflow = "hidden";
    content.style.transition =
      "max-height " + READ_MORE_DURATION_MS + "ms " + READ_MORE_EASING;

    function onEnd(e) {
      if (e && e.propertyName && e.propertyName !== "max-height") return;
      content.removeEventListener("transitionend", onEnd);
      clearReadMoreTransition(content);
      if (expanded) {
        content.style.maxHeight = "none";
        content.style.overflow = "visible";
      }
    }

    content.addEventListener("transitionend", onEnd);

    if (expanded) {
      content.classList.remove("is-truncated");
      content.classList.add("is-expanded");
      var startH = content.style.maxHeight;
      if (!startH || startH === "none") {
        startH = collapsedH + "px";
      }
      content.style.maxHeight = startH;
      void content.offsetHeight;
      content.style.maxHeight = content.scrollHeight + "px";
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
      void content.offsetHeight;
      content.classList.add("is-truncated");
      content.classList.remove("is-expanded");
      content.style.maxHeight = collapsedH + "px";
    }
  }

  function initReadMore(blockEl) {
    if (!blockEl || blockEl.hidden) return;
    var content = blockEl.querySelector("[data-vivaci-block-body]");
    var actions = blockEl.querySelector("[data-vivaci-read-more-actions]");
    if (!content || !actions) return;

    var toggle = blockEl.querySelector("[data-vivaci-read-more-toggle]");
    var label = blockEl.querySelector("[data-vivaci-read-more-label]");
    var icon = blockEl.querySelector("[data-vivaci-read-more-icon]");

    content.classList.remove("is-truncated", "is-expanded");
    content.style.maxHeight = "";
    content.style.overflow = "";
    content.style.transition = "";
    actions.classList.remove("is-visible");
    actions.hidden = true;

    window.requestAnimationFrame(function () {
      var maxH = readMoreCollapsedHeight(content);
      if (content.scrollHeight <= maxH + 2) return;

      actions.hidden = false;
      window.requestAnimationFrame(function () {
        actions.classList.add("is-visible");
      });
      setReadMoreExpanded(content, toggle, label, icon, false, false);

      if (toggle && !toggle.dataset.vivaciReadMoreBound) {
        toggle.dataset.vivaciReadMoreBound = "1";
        toggle.addEventListener("click", function (e) {
          e.preventDefault();
          var isExpanded = toggle.getAttribute("aria-expanded") === "true";
          setReadMoreExpanded(content, toggle, label, icon, !isExpanded, true);
        });
      }
    });
  }

  function initOverviewReadMore(section) {
    $all("[data-vivaci-block]", section).forEach(initReadMore);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var LUCIDE_FACT_SVGS = {
    timer:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer" aria-hidden="true"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
    clock:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>',
    "heart-pulse":
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-pulse" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>',
    bandage:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pill" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
    wallet:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    gauge:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pill" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
    banknote:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    bed:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-pulse" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>',
    "calendar-check":
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
    "layout-grid":
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
    syringe:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-syringe" aria-hidden="true"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>',
    sparkles:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
    info:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  };

  var LUCIDE_TIMELINE_SVGS = {
    syringe: LUCIDE_FACT_SVGS.syringe,
    sparkles: LUCIDE_FACT_SVGS.sparkles,
    "circle-check-big":
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big" aria-hidden="true"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>',
    "refresh-cw":
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
    timer: LUCIDE_FACT_SVGS.timer,
    "calendar-check": LUCIDE_FACT_SVGS["calendar-check"],
  };

  var TIMELINE_ICON_DEFAULTS = ["syringe", "sparkles", "circle-check-big", "refresh-cw"];

  function timelineIconKey(item, index) {
    if (item && item.icon) return item.icon;
    var title = String((item && item.title) || "");
    var body = String((item && item.body) || "");
    var t = (title + " " + body).toLowerCase();

    if (/månad|påfyll|avtar|underhåll|refill|åter/.test(t)) return "refresh-cw";
    if (/dag\s*14|full effekt|uppfölj|finjust/.test(t)) return "circle-check-big";
    if (/dag\s*[3-9]|börjar|synas|gradvis|veck/.test(t)) return "sparkles";
    if (/dag\s*0|behandling|behandlas|ingrepp|session/.test(t)) return "syringe";
    if (/kontroll|uppföljning/.test(t)) return "calendar-check";
    if (/tid|minut|timme/.test(t)) return "timer";

    return TIMELINE_ICON_DEFAULTS[index % TIMELINE_ICON_DEFAULTS.length];
  }

  function timelineIconSvg(key) {
    return LUCIDE_TIMELINE_SVGS[key] || LUCIDE_TIMELINE_SVGS.syringe;
  }

  function setTimelineItemIcon(row, item, index) {
    var embed = row.querySelector(".layout32_item-icon-wrapper .icon-embed-xsmall");
    if (embed) embed.innerHTML = timelineIconSvg(timelineIconKey(item, index));
  }

  function formatFactValue(label, value) {
    var v = value == null ? "" : String(value).trim();
    var l = String(label || "").toLowerCase();
    if (l.indexOf("pris") === -1) return v;
    if (l === "pris från") label = "Pris";
    var low = v.toLowerCase();
    if (low.indexOf("konsultation") !== -1 && !/\d/.test(v)) return v;
    if (/^fr\.?\s/i.test(v)) return "fr. " + v.replace(/^fr\.?\s*/i, "");
    if (/\d/.test(v)) return "fr. " + v;
    return v;
  }

  function displayFactLabel(label) {
    if (String(label || "").toLowerCase() === "pris från") return "Pris";
    return label;
  }

  function factIconKey(label, explicit) {
    if (explicit && LUCIDE_FACT_SVGS[explicit]) return explicit;
    var l = String(label || "").toLowerCase();
    if (
      l.indexOf("behandlingstid") !== -1 ||
      (l.indexOf("ingrip") !== -1 && l.indexOf("tid") !== -1)
    ) {
      return "timer";
    }
    if (l.indexOf("återhämt") !== -1 || l.indexOf("aterhämt") !== -1 || l.indexOf("vila") !== -1) {
      return "heart-pulse";
    }
    if (l.indexOf("smärt") !== -1 || l.indexOf("smart") !== -1 || l.indexOf("bedöv") !== -1) {
      return "bandage";
    }
    if (l.indexOf("pris") !== -1 || l.indexOf("kostnad") !== -1) {
      return "wallet";
    }
    if (l.indexOf("konsult") !== -1 || l.indexOf("boka") !== -1) {
      return "calendar-check";
    }
    if (l.indexOf("typ") !== -1 || l.indexOf("kategori") !== -1) {
      return "layout-grid";
    }
    if (l.indexOf("narkos") !== -1 || l.indexOf("anest") !== -1 || l.indexOf("injekt") !== -1) {
      return "syringe";
    }
    if (l.indexOf("resultat") !== -1 || l.indexOf("effekt") !== -1) {
      return "sparkles";
    }
    if (l.indexOf("session") !== -1 || l.indexOf("varakt") !== -1 || l.indexOf("tid") !== -1) {
      return "timer";
    }
    return "info";
  }

  function factIconSvg(label, explicit) {
    var key = factIconKey(label, explicit);
    return LUCIDE_FACT_SVGS[key] || LUCIDE_FACT_SVGS.info;
  }

  function setFactRowIcon(row, label, explicitIcon) {
    var embed = row.querySelector(".icon-embed-xsmall");
    if (embed) embed.innerHTML = factIconSvg(label, explicitIcon);
  }

  var LUCIDE_SUITABILITY_SVGS = {
    good: LUCIDE_TIMELINE_SVGS["circle-check-big"],
    assessment:
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stethoscope" aria-hidden="true"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>',
  };

  function suitabilityListKind(container) {
    if (!container) return "good";
    var kind = container.getAttribute("data-vivaci-suitability-kind");
    return kind === "assessment" ? "assessment" : "good";
  }

  function setSuitabilityItemIcon(row, kind) {
    var embed = row.querySelector(".layout65_item-icon-wrapper .icon-embed-xsmall");
    if (!embed) return;
    embed.innerHTML =
      LUCIDE_SUITABILITY_SVGS[kind] || LUCIDE_SUITABILITY_SVGS.good;
  }

  function fillList(container, items, itemSelector) {
    if (!container) return;
    var template = container.querySelector(itemSelector);
    if (!template) return;
    var parent = template.parentElement;
    var templateHtml = template.outerHTML;
    var listKind = suitabilityListKind(container);
    if (!items || !items.length) {
      parent.innerHTML = "";
      return;
    }
    parent.innerHTML = "";
    items.forEach(function (text) {
      var wrap = document.createElement("div");
      wrap.innerHTML = templateHtml;
      var node = wrap.firstElementChild;
      if (!node) return;
      var p = node.querySelector("p") || node;
      setText(p, text);
      setSuitabilityItemIcon(node, listKind);
      parent.appendChild(node);
    });
  }

  /** Show section only when JSON enabled and required content exists (no empty shells). */
  function shouldShowSection(key, section) {
    if (!section || section.enabled === false) return false;
    switch (key) {
      case "suitability":
        return (
          section.goodFor &&
          section.goodFor.length > 0 &&
          section.needsAssessment &&
          section.needsAssessment.length > 0
        );
      case "benefits":
        return !!(section.items && section.items.length);
      case "howItWorks":
        return !!(
          (section.body && String(section.body).trim()) ||
          (section.steps && section.steps.length)
        );
      case "resultsTimeline":
        return !!(section.items && section.items.length);
      case "treatmentAreas":
        return !!(section.items && section.items.length);
      case "beforeAfterCare":
        return !!(
          (section.before && section.before.length) ||
          (section.after && section.after.length) ||
          (section.introBefore && String(section.introBefore).trim()) ||
          (section.introAfter && String(section.introAfter).trim())
        );
      case "faq":
        return section.enabled !== false;
      case "related":
        return !!(section.items && section.items.length);
      case "overview": {
        var blocks = section.blocks || [];
        return blocks.some(function (b) {
          return b && b.enabled && b.body && String(b.body).trim();
        });
      }
      case "facts":
        return !!(section.items && section.items.length);
      case "quizCta":
      case "bottomCta":
        return section.enabled !== false;
      case "method":
        return section.enabled !== false;
      case "experts":
      case "trust":
        return section.enabled !== false;
      case "beforeAfterGallery":
        return section.enabled !== false && !!(section.items && section.items.length);
      default:
        return section.enabled !== false;
    }
  }

  function fillCards(grid, items, cardSelector) {
    if (!grid || !items || !items.length) return;
    var template = grid.querySelector(cardSelector);
    if (!template) return;
    var parent = template.parentElement;
    parent.innerHTML = "";
    items.forEach(function (item) {
      var node = template.cloneNode(true);
      var h = node.querySelector("h3, h6, .heading-style-h6");
      var p = node.querySelector("p");
      if (h) setText(h, item.title || item.name || "");
      if (p) setText(p, item.body || item.description || "");
      parent.appendChild(node);
    });
  }

  function fillTimeline(listEl, items) {
    if (!listEl || !items || !items.length) return;
    var template = listEl.querySelector(".layout32_item");
    if (!template) return;
    var parent = template.parentElement;
    parent.innerHTML = "";
    items.forEach(function (item, index) {
      var node = template.cloneNode(true);
      var titleEl = node.querySelector(".text-weight-bold, .text-size-medium");
      var bodyEl = node.querySelector(".text-style-muted");
      if (titleEl) setText(titleEl, item.title || "");
      if (bodyEl) setText(bodyEl, item.body || "");
      setTimelineItemIcon(node, item, index);
      parent.appendChild(node);
    });
  }

  function setBlockVisible(blockEl, enabled) {
    if (!blockEl) return;
    blockEl.hidden = !enabled;
    var divider = blockEl.nextElementSibling;
    if (divider && divider.classList.contains("line-divider")) {
      divider.hidden = !enabled;
    }
  }

  function fillFaqs(listEl, faqs) {
    if (!listEl || !faqs || !faqs.length) return;
    var template = listEl.querySelector(".faq3_accordion");
    if (!template) return;
    var templateHtml = template.outerHTML;
    var parent = template.parentElement;
    parent.innerHTML = "";
    faqs.forEach(function (faq, i) {
      var wrap = document.createElement("div");
      wrap.innerHTML = templateHtml;
      var node = wrap.firstElementChild;
      if (!node) return;
      var q = node.querySelector(
        ".faq3_question .heading-style-h6, .faq3_question .heading-style-h5, .faq3_question-text, .text-size-medium"
      );
      var a =
        node.querySelector(".faq3_answer p") ||
        node.querySelector(
          ".faq3_answer .text-style-muted, .faq3_answer-text, .text-size-regular"
        );
      if (q) setText(q, faq.question);
      if (a) setText(a, faq.answer);
      parent.appendChild(node);
      if (i > 0) {
        var toggle = node.querySelector(".faq3_question");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function destroySwiperTuesdayEl(swiperEl) {
    if (!swiperEl) return;
    if (swiperEl.swiper && !swiperEl.swiper.destroyed) {
      swiperEl.swiper.destroy(true, true);
    }
    delete swiperEl.dataset.vivaciSwiperTuesdayInit;
    var controls = swiperEl.nextElementSibling;
    if (controls && controls.classList.contains("swiper-tuesday-controls")) {
      controls.remove();
    }
  }

  function applyBeforeAfterGallery(cfg) {
    var show = shouldShowSection("beforeAfterGallery", cfg || {});
    setSectionVisible("beforeAfterGallery", show);
    if (!show) return;
    var sec = $('[data-vivaci-section="beforeAfterGallery"]');
    if (!sec) return;
    setText($('[data-vivaci-field="ba-heading"]', sec), cfg.heading);
    setText($('[data-vivaci-field="ba-intro"]', sec), cfg.intro);
    setText($('[data-vivaci-field="ba-disclaimer"]', sec), cfg.disclaimer);
    var wrapper = $('[data-vivaci-field="ba-slides"]', sec);
    var swiperEl = $('[data-vivaci-field="ba-swiper"]', sec);
    if (!wrapper || !swiperEl || !cfg.items || !cfg.items.length) return;
    var template = wrapper.querySelector("[data-vivaci-ba-slide-template]");
    if (!template) return;
    destroySwiperTuesdayEl(swiperEl);
    wrapper.innerHTML = "";
    cfg.items.forEach(function (item) {
      var slide = template.cloneNode(true);
      slide.removeAttribute("hidden");
      slide.removeAttribute("data-vivaci-ba-slide-template");
      var titleEl = slide.querySelector(".vivaci-ba-slide-title");
      var beforeImg = slide.querySelector("[data-vivaci-ba-before]");
      var afterImg = slide.querySelector("[data-vivaci-ba-after]");
      var caseTitle = item.title || "";
      if (titleEl) setText(titleEl, caseTitle);
      if (beforeImg) {
        beforeImg.src = item.beforeImage || "";
        beforeImg.alt = caseTitle ? "Före — " + caseTitle : "Före";
      }
      if (afterImg) {
        afterImg.src = item.afterImage || "";
        afterImg.alt = caseTitle ? "Efter — " + caseTitle : "Efter";
      }
      wrapper.appendChild(slide);
    });
    if (typeof window.vivaciInitSwiperTuesdayEl === "function") {
      window.vivaciInitSwiperTuesdayEl(swiperEl);
    }
  }

  function fillRelated(grid, items) {
    if (!grid || !items || !items.length) return;
    var template = grid.querySelector(".layout527_card-large");
    if (!template) return;
    var parent = template.parentElement;
    parent.innerHTML = "";
    items.forEach(function (item) {
      var node = template.cloneNode(true);
      var h = node.querySelector("h3");
      if (h) setText(h, item.title || "");
      var bg = node.querySelector(".layout527_background-image");
      if (bg && item.href) {
        var lookup = window.__vivaciTreatmentImageForHref;
        var src = lookup && lookup(item.href);
        if (src) {
          bg.src = src;
          bg.removeAttribute("srcset");
        }
      }
      var wrap = node.closest("a") || node;
      if (item.href && wrap.tagName === "A") wrap.setAttribute("href", item.href);
      else if (item.href) {
        var link = document.createElement("a");
        link.href = item.href;
        link.className = "w-inline-block";
        link.appendChild(node);
        parent.appendChild(link);
        return;
      }
      parent.appendChild(node);
    });
  }

  function applyOverview(section, overview) {
    if (!section || !overview) return;
    setText($('[data-vivaci-field="overview-tagline"]', section), overview.tagline);
    setText($('[data-vivaci-field="overview-heading"]', section), overview.heading);
    var blocksById = {};
    (overview.blocks || []).forEach(function (b) {
      blocksById[b.id] = b;
    });
    $all("[data-vivaci-block]", section).forEach(function (blockEl) {
      var id = blockEl.getAttribute("data-vivaci-block");
      if (id === "treatmentAreas") return;
      var data = blocksById[id];
      if (
        !data ||
        !data.enabled ||
        !data.body ||
        !String(data.body).trim()
      ) {
        setBlockVisible(blockEl, false);
        return;
      }
      setBlockVisible(blockEl, true);
      var h = blockEl.querySelector("h2, h5");
      var bodyWrap = blockEl.querySelector("[data-vivaci-block-body]");
      if (h && data.heading) setText(h, data.heading);
      if (bodyWrap && data.body) setHtmlParagraphs(bodyWrap, data.body);
    });
    initOverviewReadMore(section);
  }

  function applyTreatmentAreas(areas) {
    var block = $('[data-vivaci-block="treatmentAreas"]');
    if (!block) return;
    var enabled = shouldShowSection("treatmentAreas", areas || {});
    setBlockVisible(block, enabled);
    if (enabled) {
      fillCards(block.querySelector(".layout401_row"), areas.items, ".layout401_card-content");
    }
  }

  function applyBenefits(benefits) {
    setSectionVisible("benefits", shouldShowSection("benefits", benefits || {}));
    if (!shouldShowSection("benefits", benefits || {})) return;
    fillCards($('[data-vivaci-field="benefits-grid"]'), benefits.items, ".layout401_card-content");
  }

  function applyBeforeAfterCare(care) {
    setSectionVisible("beforeAfterCare", shouldShowSection("beforeAfterCare", care || {}));
    if (!shouldShowSection("beforeAfterCare", care || {})) return;
    var root = $('[data-vivaci-section="beforeAfterCare"]');
    setText($('[data-vivaci-field="before-intro"]', root), care.introBefore || "");
    setText($('[data-vivaci-field="after-intro"]', root), care.introAfter || care.introBefore || "");
    fillList($('[data-vivaci-field="before-list"]', root), care.before, ".layout65_item");
    fillList($('[data-vivaci-field="after-list"]', root), care.after, ".layout65_item");
  }

  function applyHeroImage() {
    var lookup = window.__vivaciTreatmentImageForHref;
    if (!lookup) return Promise.resolve();
    var src = lookup(window.location.pathname);
    if (!src) return Promise.resolve();
    var img = document.querySelector(".header50_background-image");
    if (!img) return Promise.resolve();
    if (window.VivaciImage && window.VivaciImage.apply) {
      return window.VivaciImage.apply(img, src, "", { fetchPriority: "high" });
    }
    img.src = src;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    return Promise.resolve();
  }

  var SHELL_SECTIONS = [
    "method",
    "faq",
    "quizCta",
    "bottomCta",
    "experts",
    "trust",
  ];

  function applyShellSections(sections) {
    SHELL_SECTIONS.forEach(function (key) {
      var cfg = sections[key] || {};
      if (cfg.enabled === false) {
        setSectionVisible(key, false);
        return;
      }
      setSectionVisible(key, true);
    });
  }

  function apply(data) {
    var sections = data.sections || {};
    if (data.title) {
      document.title = data.title + " | Vivaci";
    }

    var hero = sections.hero || {};
    var showHero = hero.enabled !== false;
    setSectionVisible("hero", showHero);
    if (showHero) {
      setText($('[data-vivaci-field="hero-title"]'), hero.title || data.title);
      setText($('[data-vivaci-field="hero-intro"]'), hero.intro || "");
      setCta(
        $('[data-vivaci-field="hero-primary-cta"]'),
        hero.primaryCta || DEFAULT_BOOKING_CTAS.primaryCta
      );
      setCta(
        $('[data-vivaci-field="hero-secondary-cta"]'),
        hero.secondaryCta || DEFAULT_BOOKING_CTAS.secondaryCta
      );
    }
    var heroImagePromise = applyHeroImage();

    var facts = sections.facts || {};
    var factsRoot = $('[data-vivaci-section="facts"]');
    var showFacts = shouldShowSection("facts", facts);
    if (factsRoot) {
      factsRoot.hidden = !showFacts;
    }
    if (showFacts && factsRoot) {
      setText($('[data-vivaci-field="facts-title"]', factsRoot), facts.title || "Snabba fakta");
      setText($('[data-vivaci-field="facts-summary"]', factsRoot), facts.summary || "");
      var factsWrap = $("[data-vivaci-field='facts-list']", factsRoot);
      if (factsWrap && facts.items && facts.items.length) {
        var row = factsWrap.querySelector(".inner-info-wrapper");
        if (row) {
          var template = row.cloneNode(true);
          factsWrap.innerHTML = "";
          facts.items.forEach(function (item, idx) {
            var node = template.cloneNode(true);
            var labels = node.querySelectorAll("p");
            var factLabel = displayFactLabel(item.label);
            if (labels[0]) setText(labels[0], factLabel || "");
            if (labels[1]) setText(labels[1], formatFactValue(factLabel, item.value));
            setFactRowIcon(node, factLabel, item.icon);
            factsWrap.appendChild(node);
            if (idx < facts.items.length - 1) {
              var div = document.createElement("div");
              div.className = "line-divider";
              factsWrap.appendChild(div);
            }
          });
        }
      }
    }

    var overviewCfg = sections.overview || {};
    if (shouldShowSection("overview", overviewCfg)) {
      setSectionVisible("overview", true);
      applyOverview($('[data-vivaci-section="overview"]'), overviewCfg);
    } else {
      setSectionVisible("overview", false);
    }

    var suit = sections.suitability || {};
    var suitSec = $('[data-vivaci-section="suitability"]');
    var showSuitability = shouldShowSection("suitability", suit);
    setSectionVisible("suitability", showSuitability);
    if (showSuitability && suitSec) {
      fillList(
        $('[data-vivaci-field="good-for-list"]', suitSec),
        suit.goodFor,
        ".layout65_item"
      );
      fillList(
        $('[data-vivaci-field="needs-assessment-list"]', suitSec),
        suit.needsAssessment,
        ".layout65_item"
      );
    } else if (suitSec) {
      fillList($('[data-vivaci-field="good-for-list"]', suitSec), [], ".layout65_item");
      fillList(
        $('[data-vivaci-field="needs-assessment-list"]', suitSec),
        [],
        ".layout65_item"
      );
    }

    var how = sections.howItWorks || {};
    setSectionVisible("howItWorks", shouldShowSection("howItWorks", how));
    if (shouldShowSection("howItWorks", how)) {
      var howSec = $('[data-vivaci-section="howItWorks"]');
      setText($('[data-vivaci-field="how-heading"]', howSec), how.heading || "Så fungerar det");
      applyHowItWorksSection(how, howSec);
    }

    applyBenefits(sections.benefits || {});
    applyTreatmentAreas(sections.treatmentAreas || {});

    var timeline = sections.resultsTimeline || {};
    setSectionVisible("resultsTimeline", shouldShowSection("resultsTimeline", timeline));
    if (shouldShowSection("resultsTimeline", timeline)) {
      var tlSec = $('[data-vivaci-section="resultsTimeline"]');
      setText(tlSec && tlSec.querySelector("h2"), timeline.heading || "Resultat över tid");
      fillTimeline($('[data-vivaci-field="timeline-list"]', tlSec), timeline.items);
    }

    applyBeforeAfterCare(sections.beforeAfterCare || {});

    var faq = sections.faq || {};
    setSectionVisible("faq", shouldShowSection("faq", faq));
    if (shouldShowSection("faq", faq)) {
      var faqSec = $('[data-vivaci-section="faq"]');
      var pageTitle = (hero.title || data.title || "behandlingen").trim();
      var faqIntro =
        faq.intro ||
        "Här hittar du svar på vanliga frågor om " +
          pageTitle +
          ". Boka gärna en kostnadsfri konsultation om du vill gå igenom dina förutsättningar.";
      setText($('[data-vivaci-field="faq-intro"]', faqSec), faqIntro);
      var faqCtaLink = $('[data-vivaci-field="faq-method-cta"]', faqSec);
      if (faqCtaLink) {
        var defaultFaqCta =
          category === "problem"
            ? { label: "Läs mer om vår metod", href: "#vivaci-method" }
            : { label: "Boka kostnadsfri konsultation", href: "/kontakt" };
        setCta(faqCtaLink, faq.methodCta || defaultFaqCta);
      }
      var faqList = $(".faq3_list", faqSec);
      fillFaqs(faqList, faq.items);
      if (window.VivaciFaqAccordion && faqList) {
        window.VivaciFaqAccordion.refresh(faqList);
      }
    }

    var related = sections.related || {};
    setSectionVisible("related", shouldShowSection("related", related));
    if (shouldShowSection("related", related)) {
      setText(
        $('[data-vivaci-section="related"] h2'),
        related.heading || "Relaterat"
      );
      fillRelated($('[data-vivaci-section="related"] .blog37_list'), related.items);
    }

    (function applyQuizCtaBlock() {
      var cfg = sections.quizCta || {};
      var sec = $('[data-vivaci-section="quizCta"]');
      if (!sec) return;
      if (!shouldShowSection("quizCta", cfg)) {
        setSectionVisible("quizCta", false);
        return;
      }
      setSectionVisible("quizCta", true);
      setText($('[data-vivaci-field="quiz-cta-heading"]', sec), cfg.heading);
      setText($('[data-vivaci-field="quiz-cta-intro"]', sec), cfg.intro);
      var quizBtn = $('[data-vivaci-field="quiz-cta-quiz"]', sec);
      var quizCfg = cfg.quizLink || {};
      if (quizBtn) {
        var showQuiz = quizCfg.enabled !== false;
        quizBtn.hidden = !showQuiz;
        if (showQuiz) {
          quizBtn.setAttribute("href", "#");
          quizBtn.setAttribute("data-vivaci-quiz-trigger", "");
          setCta(quizBtn, { label: quizCfg.label || "Gör vårt gratis quiz" });
        }
      }
    })();

    applyCtaBlock("bottomCta", sections.bottomCta || {}, {
      heading: '[data-vivaci-field="bottom-cta-heading"]',
      intro: '[data-vivaci-field="bottom-cta-intro"]',
      primary: '[data-vivaci-field="bottom-cta-primary"]',
    });

    applyBeforeAfterGallery(sections.beforeAfterGallery || {});

    applyShellSections(sections);
    return heroImagePromise;
  }

  function signalTreatmentPageReady() {
    document.documentElement.classList.remove("vivaci-content-pending");
    document.dispatchEvent(new CustomEvent("vivaci:treatment-page-ready"));
  }

  function loadPage() {
    document.documentElement.classList.add("vivaci-content-pending");
    Promise.resolve(window.__vivaciTreatmentImagesReady)
      .then(function () {
        if (window.vivaciFetchJson) return window.vivaciFetchJson(url);
        return fetch(url).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        });
      })
      .then(apply)
      .then(function () {
        signalTreatmentPageReady();
      })
      .catch(function (err) {
        console.warn("[vivaci-treatment-page]", url, err);
        signalTreatmentPageReady();
      });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(loadPage);
  } else {
    loadPage();
  }
})();
