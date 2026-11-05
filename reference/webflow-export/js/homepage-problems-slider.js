/**
 * Homepage Hudproblem carousel — same items/images as Railway production.
 * Exposes window.__vivaciHomeProblemsReady so Swiper init waits for slides.
 */
(function () {
  if (window.__vivaciHomeProblemsSliderLoaded) return;
  window.__vivaciHomeProblemsSliderLoaded = true;

  var DATA_URL = "/content/from-production/home-problems-slider.json";

  function setText(el, text) {
    if (el && text) el.textContent = text;
  }

  function fillSlide(templateSlide, item) {
    var slide = templateSlide.cloneNode(true);
    var card = slide.querySelector(".layout527_card-large");
    if (!card) return slide;

    var href = item.href || "/problem/" + item.slug;

    var img = card.querySelector(".layout527_background-image");
    if (img && item.image) {
      img.src = item.image;
      img.alt = item.name || "";
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.loading = "lazy";
    }

    var title = card.querySelector(".heading-medium");
    if (title) {
      title.textContent = item.name || "";
      var strong = title.querySelector("strong");
      if (strong) strong.replaceWith(document.createTextNode(strong.textContent));
    }

    var overlay = document.createElement("a");
    overlay.href = href;
    overlay.className = "layout527_card-hit";
    overlay.setAttribute("aria-label", item.name || "");
    card.appendChild(overlay);

    return slide;
  }

  function apply(data, root) {
    if (!root) return;
    if (!data || !Array.isArray(data.items) || !data.items.length) return;

    setText(root.querySelector('[data-vivaci-field="problems-tagline"]'), data.tagline);
    setText(root.querySelector('[data-vivaci-field="problems-heading"]'), data.heading);

    var introEl = root.querySelector('[data-vivaci-field="problems-intro"]');
    if (introEl && data.intro) {
      setText(introEl, data.intro);
    }

    var cta = root.querySelector('[data-vivaci-field="problems-cta"]');
    if (cta && data.cta) {
      if (data.cta.href) cta.href = data.cta.href;
      var ctaLabel = cta.querySelector("div");
      if (ctaLabel && data.cta.label) ctaLabel.textContent = data.cta.label;
    }

    var wrapper = root.querySelector(".swiper-tuesday .swiper-wrapper");
    if (!wrapper) return;

    var templateSlide = wrapper.querySelector(".swiper-slide");
    if (!templateSlide) return;

    wrapper.innerHTML = "";
    data.items.forEach(function (item) {
      wrapper.appendChild(fillSlide(templateSlide, item));
    });
  }

  function hydrate() {
    var root = document.getElementById("vivaci-home-problems");
    if (!root) return Promise.resolve();

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(DATA_URL)
      : fetch(DATA_URL).then(function (res) {
          if (!res.ok) throw new Error("home-problems-slider.json " + res.status);
          return res.json();
        });
    return req
      .then(function (data) {
        apply(data, root);
      })
      .catch(function (err) {
        console.warn("[vivaci] Hudproblem slider:", err);
      });
  }

  function boot() {
    return hydrate();
  }

  window.__vivaciHomeProblemsReady = new Promise(function (resolve) {
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
