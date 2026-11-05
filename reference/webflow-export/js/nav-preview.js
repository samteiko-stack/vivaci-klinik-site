(function () {
  if (window.__vivaciNavPreviewLoaded) return;
  window.__vivaciNavPreviewLoaded = true;

  var NAV_URL = "/content/from-production/nav.json";

  function fetchContent(path) {
    if (window.VivaciI18n && window.VivaciI18n.fetchContent) {
      return window.VivaciI18n.fetchContent(path);
    }
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error(path + " " + res.status);
      return res.json();
    });
  }

  function imageForHref(href) {
    var lookup = window.__vivaciTreatmentImageForHref;
    return lookup && href ? lookup(href) : null;
  }

  function isOverviewItem(item) {
    var label = (item.label || "").toLowerCase();
    var href = item.href || "";
    if (label.indexOf("all ") === 0) return true;
    var parts = href.split("/").filter(Boolean);
    return parts.length === 1;
  }

  function pickHighlights(categoryLabel, items) {
    var candidates = items.filter(function (it) {
      return !isOverviewItem(it);
    });
    if (!candidates.length) return [];
    var seed = 0;
    for (var i = 0; i < categoryLabel.length; i++) {
      seed = (seed * 31 + categoryLabel.charCodeAt(i)) >>> 0;
    }
    var shuffled = candidates.slice();
    for (var j = shuffled.length - 1; j > 0; j--) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      var k = seed % (j + 1);
      var tmp = shuffled[j];
      shuffled[j] = shuffled[k];
      shuffled[k] = tmp;
    }
    return shuffled.slice(0, 2).map(function (it) {
      return {
        href: it.href,
        label: it.label,
        description: it.description,
        image: it.image || imageForHref(it.href),
      };
    });
  }

  function highlightsLabelText() {
    return window.VivaciI18n
      ? window.VivaciI18n.t("nav.popularTreatments", null, "Populära behandlingar")
      : "Populära behandlingar";
  }

  function ensureHighlightsLabel(listEl) {
    if (!listEl) return;
    var label = listEl.querySelector("[data-vivaci-nav-highlights-label]");
    if (!label) {
      label = document.createElement("p");
      label.className = "vivaci-nav-highlights-label text-size-tiny text-style-muted";
      label.setAttribute("data-vivaci-nav-highlights-label", "");
      listEl.insertBefore(label, listEl.firstChild);
    }
    label.textContent = highlightsLabelText();
  }

  function syncAllHighlightsLabels() {
    document.querySelectorAll(".navbar10_blog-list").forEach(ensureHighlightsLabel);
  }

  function fillHighlights(listEl, highlights) {
    ensureHighlightsLabel(listEl);
    var cards = Array.prototype.slice.call(
      listEl.querySelectorAll("a.navbar10_blog-item")
    );
    var template = cards[0];
    if (!template) return;

    highlights.forEach(function (item, i) {
      var card = cards[i];
      if (!card) {
        card = template.cloneNode(true);
        listEl.appendChild(card);
        cards.push(card);
      }
      card.style.display = "";
      card.removeAttribute("data-nav-hidden");
      card.setAttribute("href", item.href);
      var title = card.querySelector(".text-weight-semibold");
      if (title) title.textContent = item.label;
      var sub = card.querySelector(".text-size-tiny.text-style-muted");
      if (sub && item.description) sub.textContent = item.description;
      var img = card.querySelector(".navbar10_blog-item-image");
      if (img && item.image) {
        img.src = item.image;
        img.removeAttribute("srcset");
        img.alt = item.label;
      }
    });

    for (var j = highlights.length; j < cards.length; j++) {
      cards[j].style.display = "none";
      cards[j].setAttribute("data-nav-hidden", "true");
    }
  }

  function fillGrid(grid, items) {
    var existing = Array.prototype.slice.call(
      grid.querySelectorAll("a.navbar12_dropdown-link")
    );
    var template = existing[0];
    if (!template) return;

    items.forEach(function (item, i) {
      var link = existing[i];
      if (!link) {
        link = template.cloneNode(true);
        grid.appendChild(link);
        existing.push(link);
      }
      link.style.display = "";
      link.removeAttribute("data-nav-hidden");
      link.setAttribute("href", item.href);
      var title = link.querySelector(".text-weight-semibold");
      if (title) title.textContent = item.label;
      var sub = link.querySelector(".text-size-tiny.text-style-muted");
      if (sub && item.description) sub.textContent = item.description;
    });

    for (var j = items.length; j < existing.length; j++) {
      existing[j].style.display = "none";
      existing[j].setAttribute("data-nav-hidden", "true");
    }
  }

  function wireTopLevelNavLinks() {
    document.querySelectorAll("a.navbar14_link.w-nav-link").forEach(function (a) {
      var label = (a.textContent || "").trim();
      if (label === "Utbildning" || label === "Training") {
        a.setAttribute("href", "/utbildning");
      }
    });
  }

  function applyUtilityLinks(data) {
    var links = data.utilityLinks || [];
    if (!links.length) return;
    document.querySelectorAll(".navbar14_menu .navbar14_link.w-nav-link").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var match = links.find(function (item) {
        return item.href === href;
      });
      if (match && match.label) a.textContent = match.label;
    });
  }

  function applyMoreLinks(data) {
    var links = data.moreLinks || [];
    var merDrop = document.querySelector(".navbar14_menu-dropdown.w-dropdown");
    var list = merDrop && merDrop.querySelector(".navbar14_dropdown-list");
    if (!list || !links.length) return;
    var template = list.querySelector(".navbar14_dropdown-link");
    if (!template) return;
    list.innerHTML = "";
    links.forEach(function (item) {
      var a = template.cloneNode(true);
      a.setAttribute("href", item.href || "#");
      a.textContent = item.label || "";
      list.appendChild(a);
    });
  }

  function applyNav(data) {
    wireTopLevelNavLinks();
    applyUtilityLinks(data);
    applyMoreLinks(data);

    var categories = data.categories || [];
    var dropdowns = document.querySelectorAll(".navbar7_menu-dropdown");

    dropdowns.forEach(function (drop, index) {
      var cat = categories[index];
      if (!cat) return;

      var toggle = drop.querySelector(".navbar14_dropdown-toggle div");
      if (toggle && cat.label) toggle.textContent = cat.label;

      var items = cat.items || [];
      var grid = drop.querySelector(".navbar12_dropdown-content");
      if (grid) fillGrid(grid, items);

      var highlightList = drop.querySelector(".navbar10_blog-list");
      if (highlightList) {
        var highlights =
          cat.highlights && cat.highlights.length
            ? cat.highlights
            : pickHighlights(cat.label || String(index), items);
        fillHighlights(highlightList, highlights);
      }
    });

    window.__vivaciNavReady = true;
    document.dispatchEvent(new CustomEvent("vivaci:nav-ready"));
  }

  function loadNav() {
    return Promise.resolve(window.__vivaciTreatmentImagesReady)
      .then(function () {
        return fetchContent(NAV_URL);
      })
      .then(applyNav)
      .catch(function (e) {
        console.warn("[nav-preview]", e.message);
      });
  }

  wireTopLevelNavLinks();

  function boot() {
    var run = function () {
      syncAllHighlightsLabels();
      loadNav();
    };
    if (window.__vivaciI18nReady) {
      window.__vivaciI18nReady.then(run);
    } else {
      run();
    }
  }

  boot();
  document.addEventListener("vivaci:i18n-ready", function () {
    syncAllHighlightsLabels();
    loadNav();
  });
  document.addEventListener("vivaci:locale-change", function () {
    var wait =
      window.VivaciI18n && window.VivaciI18n.whenReady
        ? window.VivaciI18n.whenReady()
        : window.__vivaciI18nReady;
    if (wait && wait.then) {
      wait.then(function () {
        syncAllHighlightsLabels();
        loadNav();
      });
    } else {
      syncAllHighlightsLabels();
      loadNav();
    }
  });
})();
