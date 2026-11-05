/**
 * Treatment imagery: homepage hero (Morpheus8) everywhere except /problem/* (Railway hud).
 */
(function () {
  if (window.__vivaciTreatmentImagesLoaded) return;
  window.__vivaciTreatmentImagesLoaded = true;

  var RAILWAY_URL = "/content/from-production/treatment-images.json";
  var HERO_IMAGE = "/images/Morpheus8_0146.webp";

  function normalizeHref(href) {
    if (!href) return "";
    var p = String(href).split("?")[0].split("#")[0];
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  function isHudProblemPath(href) {
    return normalizeHref(href).indexOf("/problem/") === 0;
  }

  window.__vivaciTreatmentImageForHref = function (href) {
    if (!href) return HERO_IMAGE;
    var key = normalizeHref(href);
    var all = window.__vivaciImagesByHref || {};
    if (all[key]) return all[key];
    if (isHudProblemPath(href)) {
      var hud = window.__vivaciHudImagesByHref || {};
      return hud[key] || null;
    }
    if (key.indexOf("/behandlingar/") === 0 || key.indexOf("/plastikkirurgi/") === 0) {
      return HERO_IMAGE;
    }
    return HERO_IMAGE;
  };

  window.__vivaciTreatmentImagesReady = fetch(RAILWAY_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("treatment-images.json " + res.status);
      return res.json();
    })
    .then(function (data) {
      var byHref = (data && data.byHref) || {};
      window.__vivaciImagesByHref = byHref;
      var hud = {};
      Object.keys(byHref).forEach(function (key) {
        if (key.indexOf("/problem/") === 0) {
          hud[key] = byHref[key];
        }
      });
      window.__vivaciHudImagesByHref = hud;
      return byHref;
    })
    .catch(function (err) {
      console.warn("[vivaci] treatment images:", err);
      window.__vivaciHudImagesByHref = {};
      window.__vivaciImagesByHref = {};
    });
})();
