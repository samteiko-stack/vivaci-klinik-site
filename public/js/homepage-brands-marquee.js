/**
 * Homepage Varumärken logo marquee — logos from Railway production.
 */
(function () {
  if (window.__vivaciHomeBrandsLoaded) return;
  window.__vivaciHomeBrandsLoaded = true;

  var DATA_URL = "/content/from-production/home-brands.json";

  function setText(el, text) {
    if (el && text) el.textContent = text;
  }

  var LOGO_CLASS = "logo-promo-banner";

  function fillItem(template, item) {
    var node = template.cloneNode(true);
    var img = node.querySelector("img");
    if (img) {
      img.className = LOGO_CLASS;
      img.src = item.image;
      img.alt = item.name || "";
      img.loading = "eager";
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
    }
    return node;
  }

  function apply(data, root) {
    if (!root || !data || !Array.isArray(data.items) || !data.items.length) return;

    setText(root.querySelector('[data-vivaci-field="brands-heading"]'), data.heading);
    setText(root.querySelector('[data-vivaci-field="brands-subtitle"]'), data.subtitle);

    var track = root.querySelector(".logo-marquee_track");
    if (!track) return;

    var template = track.querySelector(".logo-marquee_item");
    if (!template) return;

    track.innerHTML = "";
    data.items.forEach(function (item) {
      track.appendChild(fillItem(template, item));
    });

    if (typeof window.initLogoMarquees === "function") {
      window.initLogoMarquees();
    }
  }

  function hydrate() {
    var root = document.getElementById("vivaci-home-brands");
    if (!root) return Promise.resolve();

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(DATA_URL)
      : fetch(DATA_URL).then(function (res) {
          if (!res.ok) throw new Error("home-brands.json " + res.status);
          return res.json();
        });
    return req
      .then(function (data) {
        apply(data, root);
        window.dispatchEvent(new CustomEvent("vivaci:brands-hydrated"));
      })
      .catch(function (err) {
        console.warn("[vivaci] Varumärken:", err);
      });
  }

  function boot() {
    return hydrate();
  }

  window.__vivaciHomeBrandsReady = new Promise(function (resolve) {
    function start() {
      if (window.vivaciOnLocaleContentReady) {
        window.vivaciOnLocaleContentReady(boot).then(resolve);
      } else {
        boot().then(resolve);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });
})();
