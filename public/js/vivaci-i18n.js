/**
 * Vivaci i18n — UI catalog + localized /content JSON (sv default, en under /content/locales/en/).
 */
(function () {
  if (window.__vivaciI18nLoaded) return;
  window.__vivaciI18nLoaded = true;

  var LOCALE_KEY = "vivaci-locale";
  var DEFAULT_LOCALE = "sv";
  var SUPPORTED = { sv: true, en: true };
  var CATALOG_BASE = "/content/i18n/";

  var catalog = {};
  var replacementPairs = [];
  var readyPromise = Promise.resolve();
  var SKIP_SEL =
    "script, style, noscript, svg, .navbar2_component, footer.is-section.bg-dark, [data-vivaci-no-i18n]";

  function normalizeLocale(id) {
    var raw = (id || DEFAULT_LOCALE).toLowerCase().slice(0, 2);
    return SUPPORTED[raw] ? raw : DEFAULT_LOCALE;
  }

  function getLocale() {
    if (window.VivaciLocaleRouting && window.VivaciLocaleRouting.localeFromPathname) {
      return normalizeLocale(window.VivaciLocaleRouting.localeFromPathname());
    }
    var attr = document.documentElement.getAttribute("data-vivaci-locale");
    if (attr) return normalizeLocale(attr);
    try {
      var stored = localStorage.getItem(LOCALE_KEY);
      if (stored) return normalizeLocale(stored);
    } catch (_) {}
    /* Webflow export often has lang="en"; default site language is Swedish. */
    return DEFAULT_LOCALE;
  }

  function getByPath(obj, path) {
    if (!path) return undefined;
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interpolate(str, vars) {
    if (!str || !vars) return str;
    return String(str).replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] != null ? String(vars[key]) : "";
    });
  }

  function t(key, vars, fallback) {
    var val = getByPath(catalog, key);
    if (val == null || val === "") val = fallback;
    if (val == null) return key;
    return interpolate(String(val), vars);
  }

  function localizedContentUrl(path) {
    var locale = getLocale();
    if (locale === DEFAULT_LOCALE) return path;
    if (path.indexOf("/content/") !== 0) return path;
    return "/content/locales/" + locale + path.slice("/content".length);
  }

  function fetchContent(path) {
    var localized = localizedContentUrl(path);
    return fetch(localized).then(function (res) {
      if (res.ok) return res.json();
      if (localized !== path) {
        return fetch(path).then(function (fallbackRes) {
          if (!fallbackRes.ok) throw new Error(path + " " + fallbackRes.status);
          return fallbackRes.json();
        });
      }
      throw new Error(path + " " + res.status);
    });
  }

  function shouldSkipNode(node) {
    var el = node.nodeType === 3 ? node.parentElement : node;
    if (!el || !el.closest) return true;
    if (el.closest(SKIP_SEL)) return true;
    if (el.closest("[data-vivaci-field]")) return true;
    return false;
  }

  function loadReplacements(locale) {
    if (locale === DEFAULT_LOCALE) {
      replacementPairs = [];
      return Promise.resolve([]);
    }
    var url = "/content/locales/" + locale + "/replacements.json";
    return fetch(url)
      .then(function (res) {
        if (!res.ok) return [];
        return res.json();
      })
      .then(function (data) {
        replacementPairs = (data && data.pairs) || [];
        replacementPairs.sort(function (a, b) {
          return (b[0] || "").length - (a[0] || "").length;
        });
        return replacementPairs;
      })
      .catch(function () {
        replacementPairs = [];
        return [];
      });
  }

  function restoreSwedishText(root) {
    var scope = root || document.body;
    if (!scope) return;
    scope.querySelectorAll("[data-vivaci-i18n-src]").forEach(function (el) {
      el.textContent = el.getAttribute("data-vivaci-i18n-src");
      el.removeAttribute("data-vivaci-i18n-src");
    });
    scope.querySelectorAll("[data-vivaci-i18n-ph-src]").forEach(function (el) {
      el.placeholder = el.getAttribute("data-vivaci-i18n-ph-src");
      el.removeAttribute("data-vivaci-i18n-ph-src");
    });
  }

  function applyStringReplacements(root) {
    var locale = getLocale();
    var scope = root || document.body;
    if (!scope) return;

    if (locale === DEFAULT_LOCALE) {
      restoreSwedishText(scope);
      return;
    }
    if (!replacementPairs.length) return;

    var map = {};
    replacementPairs.forEach(function (pair) {
      if (pair && pair[0] && pair[1]) map[pair[0]] = pair[1];
    });

    scope.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(function (el) {
      if (shouldSkipNode(el)) return;
      var ph = el.placeholder;
      if (!ph || !map[ph]) return;
      if (!el.hasAttribute("data-vivaci-i18n-ph-src")) {
        el.setAttribute("data-vivaci-i18n-ph-src", ph);
      }
      el.placeholder = map[ph];
    });

    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (shouldSkipNode(node)) continue;
      var raw = node.data;
      if (!raw || !raw.trim()) continue;
      var trimmed = raw.trim();
      var translated = map[trimmed];
      if (!translated) continue;
      var parent = node.parentElement;
      if (parent && !parent.hasAttribute("data-vivaci-i18n-src")) {
        parent.setAttribute("data-vivaci-i18n-src", trimmed);
      }
      node.data = raw.replace(trimmed, translated);
    }
  }

  function applyAttributes(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(key);
      if (val === key) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.hasAttribute("data-i18n-as-value")) el.value = val;
        else el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
  }

  function loadCatalog(locale) {
    var url = CATALOG_BASE + locale + ".json";
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error(url + " " + res.status);
        return res.json();
      })
      .then(function (data) {
        catalog = data || {};
        return loadReplacements(locale).then(function () {
          applyAttributes(document);
          applyStringReplacements(document);
          document.dispatchEvent(
            new CustomEvent("vivaci:i18n-ready", { detail: { locale: locale, t: t } })
          );
          return catalog;
        });
      })
      .catch(function (err) {
        console.warn("[vivaci-i18n]", err);
        if (locale !== DEFAULT_LOCALE) return loadCatalog(DEFAULT_LOCALE);
        catalog = {};
        return catalog;
      });
  }

  function refresh() {
    var locale = getLocale();
    readyPromise = loadCatalog(locale).then(function () {
      return { locale: locale, t: t, fetchContent: fetchContent };
    });
    window.__vivaciI18nReady = readyPromise;
    return readyPromise;
  }

  document.addEventListener("vivaci:locale-change", function () {
    refresh();
  });

  window.VivaciI18n = {
    getLocale: getLocale,
    t: t,
    fetchContent: fetchContent,
    localizedContentUrl: localizedContentUrl,
    applyAttributes: applyAttributes,
    applyStringReplacements: applyStringReplacements,
    refresh: refresh,
    whenReady: function () {
      return readyPromise;
    },
  };

  refresh();
})();
