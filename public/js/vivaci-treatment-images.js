/**
 * Single catalog for treatment card + hero imagery (content/from-production/treatment-images.json).
 */
(function () {
  if (window.__vivaciTreatmentImagesLoaded) return;
  window.__vivaciTreatmentImagesLoaded = true;

  var CATALOG_URL = "/content/from-production/treatment-images.json";

  function normalizeHref(href) {
    if (!href) return "";
    var p = String(href).split("?")[0].split("#")[0];
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  function isHudProblemPath(href) {
    return normalizeHref(href).indexOf("/problem/") === 0;
  }

  function isTreatmentPath(key) {
    return (
      key.indexOf("/behandlingar/") === 0 || key.indexOf("/plastikkirurgi/") === 0
    );
  }

  window.__vivaciTreatmentImageForHref = function (href) {
    if (!href) return null;
    var key = normalizeHref(href);
    var all = window.__vivaciImagesByHref || {};
    if (all[key]) return all[key];
    if (isHudProblemPath(href)) {
      var hud = window.__vivaciHudImagesByHref || {};
      return hud[key] || null;
    }
    if (isTreatmentPath(key)) return null;
    return null;
  };

  function indexHud(byHref) {
    var hud = {};
    Object.keys(byHref).forEach(function (key) {
      if (key.indexOf("/problem/") === 0) hud[key] = byHref[key];
    });
    window.__vivaciHudImagesByHref = hud;
  }

  function commitCatalog(byHref) {
    window.__vivaciImagesByHref = byHref || {};
    indexHud(window.__vivaciImagesByHref);
    document.dispatchEvent(
      new CustomEvent("vivaci:treatment-images-ready", {
        detail: { byHref: window.__vivaciImagesByHref },
      })
    );
  }

  window.__vivaciTreatmentImagesReady = fetch(CATALOG_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("treatment-images.json " + res.status);
      return res.json();
    })
    .then(function (data) {
      var byHref = (data && data.byHref) || {};
      commitCatalog(byHref);
      return byHref;
    })
    .catch(function (err) {
      console.warn("[vivaci] treatment images:", err);
      commitCatalog({});
    });
})();
