/**
 * Legal pages — body from content/legal/{slug}.json (localized).
 */
(function () {
  var SLUG_BY_PATH = {
    "/integritetspolicy": "integritetspolicy",
    "/legal/integritetspolicy.html": "integritetspolicy",
    "/cookies": "cookies",
    "/legal/cookies.html": "cookies",
    "/villkor": "kopvillkor",
    "/legal/kopvillkor.html": "kopvillkor",
    "/avbokning": "avbokning",
    "/legal/avbokning.html": "avbokning",
  };

  function slugFromPath() {
    var path = window.location.pathname.replace(/\/$/, "") || "/";
    if (SLUG_BY_PATH[path]) return SLUG_BY_PATH[path];
    var m = path.match(/\/legal\/([^/]+)\.html$/);
    return m ? m[1] : null;
  }

  function apply(data) {
    if (!data) return;
    var titleEl = document.querySelector('[data-vivaci-field="legal-title"]');
    if (titleEl && data.title) titleEl.textContent = data.title;
    var bodyEl = document.querySelector('[data-vivaci-field="legal-body"]');
    if (bodyEl && data.bodyHtml) bodyEl.innerHTML = data.bodyHtml;
    if (data.title) document.title = data.title + " — Vivaci Klinik";
  }

  function load() {
    var slug = slugFromPath();
    if (!slug || !document.querySelector('[data-vivaci-field="legal-body"]')) return;
    var url = "/content/legal/" + slug + ".json";
    var fetcher =
      window.vivaciFetchJson ||
      (window.VivaciI18n && window.VivaciI18n.fetchContent);
    if (!fetcher) {
      fetch(url)
        .then(function (r) {
          return r.json();
        })
        .then(apply)
        .catch(function () {});
      return;
    }
    Promise.resolve(typeof fetcher === "function" ? fetcher(url) : fetcher.call(window.VivaciI18n, url))
      .then(apply)
      .catch(function () {});
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(load);
  } else {
    document.addEventListener("DOMContentLoaded", load);
    document.addEventListener("vivaci:i18n-ready", load);
    document.addEventListener("vivaci:locale-change", load);
  }
})();
