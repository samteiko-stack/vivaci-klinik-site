/**
 * Locale URL routing — sv at site root, en under /en/… (Weglot-style subdirectories).
 */
(function () {
  if (window.VivaciLocaleRouting) return;

  var DEFAULT_LOCALE = "sv";
  /** Locales that use a URL prefix (not sv). Add de: true when German ships. */
  var PREFIXED_LOCALES = { en: true };

  function localeFromPathname(pathname) {
    var path =
      pathname != null
        ? String(pathname)
        : typeof location !== "undefined"
          ? location.pathname
          : "/";
    var m = path.match(/^\/(en|de)(?=\/|$)/);
    if (!m || !PREFIXED_LOCALES[m[1]]) return DEFAULT_LOCALE;
    return m[1];
  }

  function stripLocalePrefix(pathname) {
    var path = pathname != null ? String(pathname) : "/";
    return path.replace(/^\/(en|de)(?=\/|$)/, "") || "/";
  }

  function localizePath(pathname, localeId) {
    var bare = stripLocalePrefix(pathname);
    var locale = String(localeId || DEFAULT_LOCALE)
      .toLowerCase()
      .slice(0, 2);
    if (locale === DEFAULT_LOCALE || !PREFIXED_LOCALES[locale]) return bare;
    return bare === "/" ? "/" + locale : "/" + locale + bare;
  }

  function isLocalHref(href) {
    if (!href) return false;
    if (href.indexOf("#") === 0) return false;
    if (/^(https?:|mailto:|tel:)/i.test(href)) return false;
    return true;
  }

  function localizeHref(href, localeId) {
    if (!isLocalHref(href)) return href;
    var hash = "";
    var query = "";
    var path = href;
    var hashAt = path.indexOf("#");
    if (hashAt !== -1) {
      hash = path.slice(hashAt);
      path = path.slice(0, hashAt);
    }
    var queryAt = path.indexOf("?");
    if (queryAt !== -1) {
      query = path.slice(queryAt);
      path = path.slice(0, queryAt);
    }
    if (path.charAt(0) !== "/") path = "/" + path;
    return localizePath(path, localeId) + query + hash;
  }

  function bootDocumentLocale() {
    if (!document || !document.documentElement) return;
    var locale = localeFromPathname();
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("data-vivaci-locale", locale);
    try {
      localStorage.setItem("vivaci-locale", locale);
    } catch (_) {}
  }

  if (typeof document !== "undefined") {
    if (document.documentElement) bootDocumentLocale();
    else document.addEventListener("DOMContentLoaded", bootDocumentLocale);
  }

  window.VivaciLocaleRouting = {
    DEFAULT_LOCALE: DEFAULT_LOCALE,
    PREFIXED_LOCALES: PREFIXED_LOCALES,
    localeFromPathname: localeFromPathname,
    stripLocalePrefix: stripLocalePrefix,
    localizePath: localizePath,
    localizeHref: localizeHref,
    bootDocumentLocale: bootDocumentLocale,
  };
})();
