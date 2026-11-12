/**
 * Treatment card labels: sanitize scraped CMS strings, split parenthetical subtitles.
 * Example: "Otoplastik (öronkorrigering)" → main + subtitle "(öronkorrigering)".
 */
(function () {
  var BOILERPLATE_RE = /premiumbehandling|utförs på vivaci|är en av våra/i;
  var CATEGORY_PREFIX_RE =
    /^(problem|injektion|hud|kropp|hår|har|plastikkirurgi)\s+/i;

  function hrefToDisplayName(href) {
    if (!href) return "";
    var slug =
      href.split("?")[0].replace(/\/$/, "").split("/").pop() || "";
    return slug
      .split("-")
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function looksLikeScrapedBlob(raw) {
    var s = String(raw || "").trim();
    return !s || s.length > 56 || BOILERPLATE_RE.test(s);
  }

  function extractTreatmentNameFromBlob(raw) {
    var stripped = String(raw || "")
      .trim()
      .replace(CATEGORY_PREFIX_RE, "")
      .trim();
    if (!stripped) return "";

    var sansBoiler = stripped.split(/\s+är en av våra/i)[0].trim();
    if (!sansBoiler) return "";

    var dup = sansBoiler.match(/^(.+)\s+\1$/);
    if (dup) return dup[1].trim();

    if (sansBoiler.length <= 40 && !BOILERPLATE_RE.test(sansBoiler)) {
      var short = sansBoiler.match(
        /^([A-Za-zÀ-ÿ0-9+°₂-]+(?:\s+[A-Za-zÀ-ÿ0-9+°₂-]+){0,4})/
      );
      if (short) return short[1].trim();
    }

    return sansBoiler.slice(0, 48).trim();
  }

  /**
   * @param {{ label?: string, name?: string, title?: string, href?: string }} item
   * @returns {string}
   */
  window.vivaciResolveTreatmentCardLabel = function (item) {
    if (!item) return "";
    var label = String(item.label || "").trim();
    if (label && !looksLikeScrapedBlob(label)) return label;

    var raw = String(item.name || item.title || "").trim();
    if (raw && !looksLikeScrapedBlob(raw)) return raw;

    if (looksLikeScrapedBlob(raw)) {
      var fromBlob = extractTreatmentNameFromBlob(raw);
      if (fromBlob && !looksLikeScrapedBlob(fromBlob)) return fromBlob;
      var fromHref = hrefToDisplayName(item.href);
      if (fromHref) return fromHref;
    }

    return raw || label || hrefToDisplayName(item.href);
  };
})();

(function () {
  if (window.vivaciApplyTreatmentCardTitle) return;

  var PAREN_RE = /^(.+?)\s*\(([^)]+)\)\s*$/;

  function parseTreatmentCardTitle(raw) {
    var s = String(raw || "").trim();
    if (!s) return { main: "", subtitle: "", full: "" };
    var m = s.match(PAREN_RE);
    if (!m) return { main: s, subtitle: "", full: s };
    var main = m[1].trim();
    var subtitle = "(" + m[2].trim() + ")";
    return { main: main, subtitle: subtitle, full: main + " " + subtitle };
  }

  function ensureTitleWrap(titleEl) {
    if (!titleEl) return null;
    var existing = titleEl.closest(".vivaci-treatment-card__title-wrap");
    if (existing) return existing;

    var wrap = document.createElement("div");
    wrap.className = "vivaci-treatment-card__title-wrap";
    var parent = titleEl.parentNode;
    if (!parent) return null;
    parent.insertBefore(wrap, titleEl);
    wrap.appendChild(titleEl);
    return wrap;
  }

  /**
   * @param {HTMLElement} titleEl heading inside a treatment card
   * @param {string} raw treatment name only (no category/intro)
   * @returns {string} accessible full title (main + subtitle when split)
   */
  window.vivaciApplyTreatmentCardTitle = function (titleEl, raw) {
    var parts = parseTreatmentCardTitle(raw);
    if (!titleEl) return parts.full;

    titleEl.textContent = parts.main;
    Array.prototype.slice
      .call(titleEl.querySelectorAll("strong"))
      .forEach(function (strong) {
        strong.replaceWith(document.createTextNode(strong.textContent));
      });

    var wrap = ensureTitleWrap(titleEl);
    if (wrap) {
      var oldSub = wrap.querySelector(".vivaci-treatment-card__subtitle");
      if (oldSub) oldSub.remove();
      if (parts.subtitle) {
        var sub = document.createElement("p");
        sub.className =
          "vivaci-treatment-card__subtitle text-size-small text-style-muted";
        sub.textContent = parts.subtitle;
        wrap.appendChild(sub);
      }
    }

    return parts.full;
  };

  window.vivaciParseTreatmentCardTitle = parseTreatmentCardTitle;
})();
