/**
 * Localized JSON fetch — use for every /content/… request.
 */
(function () {
  function fetchJson(path) {
    if (window.VivaciI18n && window.VivaciI18n.fetchContent) {
      return window.VivaciI18n.fetchContent(path);
    }
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error(path + " " + res.status);
      return res.json();
    });
  }

  function onLocaleContentReady(fn) {
    if (typeof fn !== "function") {
      return Promise.resolve();
    }
    var ranAfterI18n = false;
    var run = function () {
      var wait =
        window.VivaciI18n && window.VivaciI18n.whenReady
          ? window.VivaciI18n.whenReady()
          : window.__vivaciI18nReady;
      return Promise.resolve(wait).then(fn);
    };
    var first = run().then(function () {
      if (window.__vivaciI18nReady) {
        ranAfterI18n = true;
      }
    });
    document.addEventListener("vivaci:i18n-ready", function () {
      if (ranAfterI18n) return;
      ranAfterI18n = true;
      run();
    });
    document.addEventListener("vivaci:locale-change", function () {
      run();
    });
    return first;
  }

  window.vivaciFetchJson = fetchJson;
  window.vivaciOnLocaleContentReady = onLocaleContentReady;
})();
