/**
 * Canonical layout527 treatment card (image, title, link).
 *
 * Used by: treatment-finder grid (wrap link), homepage featured slider,
 * treatment PDP related slider, behandlingar listing (via treatment-finder).
 *
 * Nav mega-menu previews (navbar10_*) are a separate component — not built here.
 *
 * @typedef {Object} VivaciTreatmentCardItem
 * @property {string} [href]
 * @property {string} [label]
 * @property {string} [name]
 * @property {string} [title]
 * @property {string} [image]
 *
 * @typedef {Object} VivaciTreatmentCardOptions
 * @property {HTMLElement} [template] clone root (.layout527_card-large or wrap)
 * @property {"wrap"|"overlay"} [linkMode] grid: entire card is <a>; slider: .layout527_card-hit
 * @property {string} [fallbackImage]
 * @property {function(VivaciTreatmentCardItem, string): string} [getTitleRaw]
 * @property {string} [dataLabelKey] data-treatment-label source (defaults to raw title)
 */

(function () {
  if (window.__vivaciTreatmentCardLoaded) return;
  window.__vivaciTreatmentCardLoaded = true;

  var DEFAULT_FALLBACK = "/images/ak/treatments/hydrafacial.jpg";

  function isAkTreatmentImage(src) {
    return Boolean(src && String(src).indexOf("/images/ak/treatments/") === 0);
  }

  function defaultTitleRaw(item) {
    if (window.vivaciResolveTreatmentCardLabel) {
      return window.vivaciResolveTreatmentCardLabel(item);
    }
    return String(item.label || item.name || item.title || "").trim();
  }

  /**
   * @param {VivaciTreatmentCardItem} item
   * @param {string} [fallback]
   * @returns {string}
   */
  function resolveTreatmentCardImage(item, fallback) {
    var lookup = window.__vivaciTreatmentImageForHref;
    if (lookup && item && item.href) {
      var mapped = lookup(item.href);
      if (mapped) return mapped;
    }
    if (item && isAkTreatmentImage(item.image)) return item.image;
    return fallback || "";
  }

  function setTreatmentCardImage(img, src, alt) {
    if (!img) return;
    if (src) {
      img.src = src;
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
    }
    if (alt != null) img.alt = alt;
  }

  function markTreatmentCard(card) {
    if (card) card.classList.add("is-vivaci-treatment-card");
  }

  /** Canonical title typography: heading-style-h6 (not heading-medium). */
  function normalizeTitleEl(titleEl) {
    if (!titleEl) return null;
    if (titleEl.classList.contains("heading-medium")) {
      titleEl.classList.remove("heading-medium");
    }
    if (!titleEl.classList.contains("heading-style-h6")) {
      titleEl.classList.add("heading-style-h6");
    }
    return titleEl;
  }

  function findTitleEl(card) {
    return normalizeTitleEl(
      card.querySelector(".heading-style-h6, .heading-medium")
    );
  }

  function ensureHitOverlay(card, href, ariaLabel) {
    card.querySelectorAll("a.layout527_card-hit").forEach(function (el) {
      el.remove();
    });
    var overlay = document.createElement("a");
    overlay.href = href || "#";
    overlay.className = "layout527_card-hit";
    overlay.setAttribute("aria-label", ariaLabel || "");
    card.appendChild(overlay);
  }

  /**
   * Hydrate an existing .layout527_card-large (or element containing one).
   * @param {HTMLElement} root card or slide containing .layout527_card-large
   * @param {VivaciTreatmentCardItem} item
   * @param {VivaciTreatmentCardOptions} [options]
   * @returns {string} accessible full title
   */
  function hydrateTreatmentCard(root, item, options) {
    options = options || {};
    if (!root || !item) return "";

    var card =
      root.classList && root.classList.contains("layout527_card-large")
        ? root
        : root.querySelector(".layout527_card-large");
    if (!card) return "";

    markTreatmentCard(card);

    var getTitleRaw = options.getTitleRaw || defaultTitleRaw;
    var titleRaw = getTitleRaw(item, defaultTitleRaw(item));
    var href = item.href || "#";
    var image = resolveTreatmentCardImage(
      item,
      options.fallbackImage || DEFAULT_FALLBACK
    );
    var accessibleTitle = titleRaw;

    var img = card.querySelector(".layout527_background-image");
    setTreatmentCardImage(img, image, titleRaw);

    var titleEl = findTitleEl(card);
    if (titleEl) {
      if (window.vivaciApplyTreatmentCardTitle) {
        accessibleTitle = window.vivaciApplyTreatmentCardTitle(titleEl, titleRaw);
      } else {
        titleEl.textContent = titleRaw;
        accessibleTitle = titleRaw;
        Array.prototype.slice
          .call(titleEl.querySelectorAll("strong"))
          .forEach(function (strong) {
            strong.replaceWith(document.createTextNode(strong.textContent));
          });
      }
    }

    if (options.dataLabelKey != null) {
      card.setAttribute("data-treatment-label", options.dataLabelKey);
    } else if (options.setDataLabel && titleRaw) {
      card.setAttribute("data-treatment-label", titleRaw);
    }

    var linkMode = options.linkMode || "overlay";
    if (linkMode === "overlay") {
      ensureHitOverlay(card, href, accessibleTitle);
    }

    return accessibleTitle;
  }

  /**
   * Clone a Webflow card template and return a grid card wrapped in <a> (finder grid).
   * @param {HTMLElement} template
   * @param {VivaciTreatmentCardItem} item
   * @param {VivaciTreatmentCardOptions} [options]
   * @returns {HTMLElement}
   */
  function renderWrappedGridCard(template, item, options) {
    options = options || {};
    if (!template || !item) return template;

    var shell = template.cloneNode(true);
    var link = document.createElement("a");
    link.href = item.href || "#";
    link.className = shell.className;
    var getTitleRaw = options.getTitleRaw || defaultTitleRaw;
    var label = getTitleRaw(item, defaultTitleRaw(item));
    if (label) link.setAttribute("data-treatment-label", label);
    while (shell.firstChild) link.appendChild(shell.firstChild);

    hydrateTreatmentCard(link, item, {
      linkMode: "none",
      getTitleRaw: getTitleRaw,
      fallbackImage: options.fallbackImage,
      dataLabelKey: label,
    });

    return link;
  }

  /**
   * @param {VivaciTreatmentCardItem} item
   * @param {VivaciTreatmentCardOptions} [options]
   * @returns {HTMLElement|null}
   */
  function renderTreatmentCard(item, options) {
    options = options || {};
    var template = options.template;
    if (!template || !item) return null;

    if (options.linkMode === "wrap") {
      return renderWrappedGridCard(template, item, options);
    }

    var node = template.cloneNode(true);
    hydrateTreatmentCard(node, item, {
      linkMode: options.linkMode || "overlay",
      getTitleRaw: options.getTitleRaw,
      fallbackImage: options.fallbackImage,
    });
    return node;
  }

  window.vivaciResolveTreatmentCardImage = resolveTreatmentCardImage;
  window.vivaciHydrateTreatmentCard = hydrateTreatmentCard;
  window.vivaciRenderTreatmentCard = renderTreatmentCard;
})();
