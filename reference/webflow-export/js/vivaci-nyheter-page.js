/**
 * Nyheter listing hero copy from content/nyheter/page.json
 */
(function () {
  "use strict";

  var PAGE_URL = "/content/nyheter/page.json";

  function setText(root, sel, text) {
    var el = root.querySelector(sel);
    if (el && text) {
      el.textContent = text;
    }
  }

  function hydrate() {
    var root = document.getElementById("vivaci-nyheter-hero");
    if (!root) {
      return Promise.resolve();
    }

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(PAGE_URL)
      : fetch(PAGE_URL).then(function (res) {
          return res.ok ? res.json() : Promise.reject();
        });

    return req
      .then(function (data) {
        setText(root, '[data-vivaci-field="hero-eyebrow"]', data.heroEyebrow);
        setText(root, '[data-vivaci-field="hero-title"]', data.heroTitle);
        setText(root, '[data-vivaci-field="hero-intro"]', data.heroIntro);
      })
      .catch(function () {
        /* static HTML fallback */
      });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(hydrate);
  } else {
    hydrate();
  }
})();
