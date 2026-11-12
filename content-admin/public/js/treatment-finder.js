/**
 * Category finder — sticky sidebar + searchable card grid (behandlingar, utbildning, home).
 */
(function () {
  if (window.__vivaciCategoryFinderBooted) return;
  window.__vivaciCategoryFinderBooted = true;

  var DEFAULT_ORDER = [
    "Plastikkirurgi",
    "Hud",
    "Injektion",
    "Kropp",
    "Hår",
  ];

  function isAkTreatmentImage(src) {
    return Boolean(src && String(src).indexOf("/images/ak/treatments/") === 0);
  }

  function imageForItem(item) {
    var lookup = window.__vivaciTreatmentImageForHref;
    if (lookup && item && item.href) {
      var mapped = lookup(item.href);
      if (mapped) return mapped;
    }
    if (item && isAkTreatmentImage(item.image)) return item.image;
    return null;
  }

  var AK_TREATMENT_FALLBACK = "/images/ak/treatments/hydrafacial.jpg";

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function parseOrder(root) {
    var raw = root.getAttribute("data-category-order");
    if (!raw) return DEFAULT_ORDER.slice();
    return raw.split(",").map(function (s) {
      return s.trim();
    }).filter(Boolean);
  }

  function initFinder(root) {
    var navUrl =
      root.getAttribute("data-nav-url") || "/content/from-production/nav.json";
    var categoryOrder = parseOrder(root);
    var searchPlaceholder =
      root.getAttribute("data-search-placeholder") || "Sök behandling";
    var emptySearch =
      root.getAttribute("data-empty-search") ||
      "Inga behandlingar matchar din sökning.";
    var emptyCategory =
      root.getAttribute("data-empty-category") ||
      "Inga behandlingar i den här kategorin.";

    var navLinks = Array.prototype.slice.call(
      root.querySelectorAll(".left-treatment-nav-link")
    );
    var grid = root.querySelector(".treatment-grid");
    if (grid) grid.classList.add("is-loading-treatments");
    var searchInput = root.querySelector(".filters5_keyword-search input");

    var gridOnly = root.hasAttribute("data-finder-grid-only");

    if (!grid) return;
    if (!gridOnly && navLinks.length === 0) return;

    var cardVariant = root.getAttribute("data-card-variant") || "overlay";
    var ctaLabel = root.getAttribute("data-cta-label") || "Läs mer";
    var ctaPrimaryHref =
      root.getAttribute("data-cta-primary-href") || "https://www.bokadirekt.se/places/vivaci-klinik-51774";
    var ctaPrimaryLabel =
      root.getAttribute("data-cta-primary-label") || "Anmäl intresse";
    var ctaSecondaryLabel =
      root.getAttribute("data-cta-secondary-label") || "Läs mer";
    var gridOrphanUseQuiz =
      root.getAttribute("data-grid-orphan-quiz") === "true";
    var gridOrphanHref =
      root.getAttribute("data-grid-orphan-href") || "https://www.bokadirekt.se/places/vivaci-klinik-51774";
    var gridOrphanKicker =
      root.getAttribute("data-grid-orphan-kicker") ||
      "Behöver du vägledning?";
    var gridOrphanLabel =
      root.getAttribute("data-grid-orphan-label") || "Boka konsultation";

    var CHEVRON_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img"><path d="m9 18 6-6-6-6"/></svg>';

    function createGridOrphanCta() {
      var wrap = document.createElement("div");
      wrap.className =
        "vivaci-grid-orphan-cta layout527_card-large is-grid text-color-alternate";
      wrap.setAttribute("data-vivaci-grid-orphan-cta", "");

      var inner = document.createElement("div");
      inner.className = "vivaci-grid-orphan-cta_inner";

      var kicker = document.createElement("p");
      kicker.className = "text-size-small text-style-muted";
      kicker.textContent = gridOrphanKicker;

      var btn = document.createElement("a");
      btn.className = "button is-icon is-small w-inline-block";
      if (gridOrphanUseQuiz) {
        btn.setAttribute("href", "#");
        btn.setAttribute("data-vivaci-quiz-trigger", "");
        btn.setAttribute("data-vivaci-quiz-locale", "sv");
      } else {
        btn.setAttribute("href", gridOrphanHref);
      }

      var label = document.createElement("div");
      label.textContent = gridOrphanLabel;

      var iconWrap = document.createElement("div");
      iconWrap.className = "icon-embed-xxsmall text-style-muted w-embed";
      iconWrap.innerHTML = CHEVRON_SVG;

      btn.appendChild(label);
      btn.appendChild(iconWrap);
      inner.appendChild(kicker);
      inner.appendChild(btn);
      wrap.appendChild(inner);
      return wrap;
    }

    if (cardVariant === "simple") {
      grid.classList.add("is-vivaci-simple-grid");
    }

    var categoriesByLabel = {};
    var activeCategory = null;
    var searchQuery = "";
    var cardTemplate = null;
    var searchDebounce = null;
    var dataReady = false;
    var dataLoadStarted = false;
    var gridSeq = 0;

    function isOverviewItem(item) {
      var label = (item.label || "").toLowerCase();
      var href = item.href || "";
      if (label.indexOf("all ") === 0) return true;
      var parts = href.split("/").filter(Boolean);
      return parts.length === 1;
    }

    function treatmentItems(label) {
      var items = categoriesByLabel[label] || [];
      return items.filter(function (it) {
        return !isOverviewItem(it);
      });
    }

    function allListingItems() {
      var out = [];
      var seen = {};
      function pushItem(it) {
        var key = it.href || it.label;
        if (!key || seen[key]) return;
        seen[key] = true;
        out.push(it);
      }
      categoryOrder.forEach(function (label) {
        treatmentItems(label).forEach(pushItem);
      });
      Object.keys(categoriesByLabel).forEach(function (label) {
        if (categoryOrder.indexOf(label) !== -1) return;
        treatmentItems(label).forEach(pushItem);
      });
      if (!out.length) {
        Object.keys(categoriesByLabel).forEach(function (label) {
          treatmentItems(label).forEach(pushItem);
        });
      }
      return out;
    }

    function cardFromSimpleTemplate(template, item) {
      var card = template.cloneNode(true);
      card.setAttribute("data-treatment-label", item.label);
      var href = item.href || "#";
      var src = imageForItem(item) || AK_TREATMENT_FALLBACK;

      var media = card.querySelector(".vivaci-listing-card__media");
      if (media) media.setAttribute("href", href);

      var img = card.querySelector(".vivaci-listing-card__image");
      if (img) {
        img.src = src;
        img.removeAttribute("srcset");
        img.alt = item.label || "";
      }

      var title = card.querySelector(".vivaci-listing-card__title");
      if (title) {
        if (window.vivaciApplyTreatmentCardTitle) {
          window.vivaciApplyTreatmentCardTitle(title, item.label || "");
        } else {
          title.textContent = item.label || "";
        }
      }

      var desc = card.querySelector(".vivaci-listing-card__desc");
      if (desc) {
        desc.textContent = item.description || "";
        desc.hidden = !item.description;
      }

      var cta = card.querySelector("[data-vivaci-listing-cta]");
      if (cta) {
        cta.setAttribute("href", href);
        cta.textContent = ctaLabel;
        return card;
      }

      var readMore = card.querySelector(".vivaci-listing-card__read-more");
      if (readMore) readMore.setAttribute("href", href);

      var ctaPrimary = card.querySelector("[data-vivaci-listing-cta-primary]");
      if (ctaPrimary) {
        ctaPrimary.setAttribute("href", ctaPrimaryHref);
        ctaPrimary.textContent = ctaPrimaryLabel;
      }

      var ctaSecondary = card.querySelector(
        "[data-vivaci-listing-cta-secondary]"
      );
      if (ctaSecondary) {
        ctaSecondary.setAttribute("href", href);
        ctaSecondary.textContent = ctaSecondaryLabel;
      }

      return card;
    }

    function cardFromTemplate(template, item) {
      if (cardVariant === "simple") {
        return cardFromSimpleTemplate(template, item);
      }

      if (window.vivaciRenderTreatmentCard) {
        return window.vivaciRenderTreatmentCard(item, {
          template: template,
          linkMode: "wrap",
          fallbackImage: imageForItem(item) || AK_TREATMENT_FALLBACK,
          getTitleRaw: function (it) {
            return it.label || "";
          },
        });
      }

      var shell = template.cloneNode(true);
      var link = document.createElement("a");
      link.href = item.href;
      link.className = shell.className;
      link.setAttribute("data-treatment-label", item.label);
      while (shell.firstChild) link.appendChild(shell.firstChild);

      var title = link.querySelector(".heading-style-h6");
      if (title) {
        if (window.vivaciApplyTreatmentCardTitle) {
          window.vivaciApplyTreatmentCardTitle(title, item.label || "");
        } else {
          title.textContent = item.label || "";
        }
      }

      var img = link.querySelector(".layout527_background-image");
      if (img) {
        var src = imageForItem(item);
        if (src) {
          img.src = src;
          img.removeAttribute("srcset");
          img.alt = item.label;
        }
      }

      return link;
    }

    function matchesSearch(item) {
      if (!searchQuery) return true;
      var q = searchQuery.toLowerCase();
      return (
        (item.label && item.label.toLowerCase().indexOf(q) !== -1) ||
        (item.description && item.description.toLowerCase().indexOf(q) !== -1)
      );
    }

    function captureTemplate() {
      if (cardTemplate) return;
      if (cardVariant === "simple") {
        var tpl = document.getElementById("vivaci-listing-card-template");
        if (tpl && tpl.content && tpl.content.firstElementChild) {
          cardTemplate = tpl.content.firstElementChild.cloneNode(true);
          return;
        }
        var simpleNode = grid.querySelector(".vivaci-listing-card");
        if (simpleNode) cardTemplate = simpleNode.cloneNode(true);
        return;
      }
      var node = grid.querySelector(".layout527_card-large");
      if (node) cardTemplate = node.cloneNode(true);
    }

    function populateGrid(items) {
      grid.classList.add("is-swapping-treatments");

      if (!items.length) {
        var empty = document.createElement("p");
        empty.className = "text-size-regular text-style-muted";
        empty.style.gridColumn = "1 / -1";
        empty.textContent = searchQuery ? emptySearch : emptyCategory;
        if (typeof grid.replaceChildren === "function") {
          grid.replaceChildren(empty);
        } else {
          grid.innerHTML = "";
          grid.appendChild(empty);
        }
        grid.classList.remove("is-swapping-treatments");
        return [];
      }

      var frag = document.createDocumentFragment();
      var cards = [];
      items.forEach(function (item) {
        var card = cardFromTemplate(cardTemplate, item);
        frag.appendChild(card);
        cards.push(card);
      });
      if (cardVariant !== "simple" && items.length % 2 === 1) {
        var orphanCta = createGridOrphanCta();
        frag.appendChild(orphanCta);
        cards.push(orphanCta);
      }
      if (typeof grid.replaceChildren === "function") {
        grid.replaceChildren.apply(grid, Array.from(frag.childNodes));
      } else {
        grid.innerHTML = "";
        grid.appendChild(frag);
      }
      grid.classList.remove("is-swapping-treatments");
      return cards;
    }

    function stopGridMotion() {
      gridSeq += 1;
      if (typeof gsap !== "undefined") {
        gsap.killTweensOf(
          grid.querySelectorAll(".layout527_card-large, .vivaci-listing-card")
        );
      }
      grid.classList.remove("is-animating");
    }

    function animateCardsIn(cards, seq) {
      if (!cards.length || seq !== gridSeq) return;

      if (prefersReducedMotion() || typeof gsap === "undefined") {
        return;
      }

      grid.classList.add("is-animating");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.36,
          stagger: { each: 0.035, max: 0.28 },
          ease: "power2.out",
          clearProps: "transform,opacity",
          onComplete: function () {
            if (seq !== gridSeq) return;
            grid.classList.remove("is-animating");
          },
        }
      );
    }

    function renderGrid(animate) {
      if (!cardTemplate) return;
      if (!gridOnly && !activeCategory) return;

      var items = (
        gridOnly ? allListingItems() : treatmentItems(activeCategory)
      ).filter(matchesSearch);
      stopGridMotion();
      var seq = gridSeq;
      var cards = populateGrid(items);

      if (animate) {
        animateCardsIn(cards, seq);
      }
    }

    function setActiveNav(index) {
      navLinks.forEach(function (el, i) {
        el.classList.toggle("is-active", i === index);
        if (i === index) {
          el.setAttribute("aria-current", "true");
        } else {
          el.removeAttribute("aria-current");
        }
      });
    }

    function setNavEnabled(enabled) {
      navLinks.forEach(function (el) {
        if (enabled) {
          el.removeAttribute("aria-disabled");
        } else {
          el.setAttribute("aria-disabled", "true");
        }
      });
    }

    function selectCategory(label, navIndex, animate) {
      if (!dataReady || !categoriesByLabel[label]) return;

      activeCategory = label;
      setActiveNav(navIndex);
      renderGrid(animate !== false);
    }

    function syncNavLabels() {
      navLinks.forEach(function (el, index) {
        var label = categoryOrder[index];
        if (!label) {
          el.style.display = "none";
          return;
        }
        el.style.display = "";
        var tagged = el.querySelector(".div-10 > div:first-child");
        var plain = el.children[0];
        var textEl =
          tagged ||
          (plain && plain.tagName === "DIV" && !plain.classList.contains("icon-embed-xsmall")
            ? plain
            : null);
        if (textEl) textEl.textContent = label;
        el.setAttribute("data-nav-category", label);
      });
    }

    function wireNav() {
      navLinks.forEach(function (el, index) {
        var label = categoryOrder[index];
        if (!label) return;
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.addEventListener("click", function () {
          selectCategory(label, index);
        });
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectCategory(label, index);
          }
        });
      });
    }

    function wireSearch() {
      if (!searchInput) return;
      searchInput.placeholder = searchPlaceholder;
      searchInput.setAttribute("aria-label", searchPlaceholder);
      searchInput.addEventListener("input", function () {
        if (!dataReady) return;
        searchQuery = searchInput.value.trim();
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(function () {
          renderGrid(true);
        }, 180);
      });
    }

    captureTemplate();
    if (!gridOnly) {
      syncNavLabels();
      setNavEnabled(false);
      wireNav();
      wireSearch();
    }

    function applyFinderUiStrings() {
      if (window.VivaciI18n && window.VivaciI18n.t) {
        searchPlaceholder = window.VivaciI18n.t(
          "finder.searchPlaceholder",
          null,
          searchPlaceholder
        );
        emptySearch = window.VivaciI18n.t("finder.emptySearch", null, emptySearch);
        emptyCategory = window.VivaciI18n.t("finder.emptyCategory", null, emptyCategory);
      }
      if (searchInput) searchInput.placeholder = searchPlaceholder;
    }

    function startFinder() {
      applyFinderUiStrings();
      if (dataLoadStarted) return;
      dataLoadStarted = true;

      var req = window.vivaciFetchJson
        ? window.vivaciFetchJson(navUrl)
        : fetch(navUrl).then(function (r) {
            if (!r.ok) throw new Error(navUrl + " " + r.status);
            return r.json();
          });
      req
        .then(function (data) {
          (data.categories || []).forEach(function (cat) {
            categoriesByLabel[cat.label] = cat.items || [];
          });
          categoryOrder = categoryOrder.filter(function (label) {
            return categoriesByLabel[label];
          });
          if (!categoryOrder.length) {
            categoryOrder = Object.keys(categoriesByLabel);
          }
          dataReady = true;
          if (gridOnly) {
            renderGrid(false);
          } else {
            syncNavLabels();
            setNavEnabled(true);
            selectCategory(categoryOrder[0], 0, false);
          }
          if (grid) grid.classList.remove("is-loading-treatments");
          document.dispatchEvent(new CustomEvent("vivaci:listing-ready"));
        })
        .catch(function (e) {
          console.warn("[category-finder]", e.message);
          if (grid) grid.classList.remove("is-loading-treatments");
          document.dispatchEvent(new CustomEvent("vivaci:listing-ready"));
        });
    }

    Promise.resolve(window.__vivaciTreatmentImagesReady).then(startFinder);
    document.addEventListener("vivaci:i18n-ready", function () {
      applyFinderUiStrings();
      if (!dataLoadStarted) startFinder();
    });
  }

  var roots = document.querySelectorAll("[data-vivaci-category-finder]");
  if (!roots.length) {
    var legacy = document.getElementById("vivaci-treatment-finder");
    if (legacy) {
      legacy.setAttribute("data-vivaci-category-finder", "");
      roots = [legacy];
    }
  }

  Array.prototype.forEach.call(roots, initFinder);
})();
