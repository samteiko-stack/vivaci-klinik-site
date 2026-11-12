/**
 * Utvalda behandlingar — copy + Railway images from home-featured-treatments.json.
 * Shared slider mount for treatment-page related section.
 */
(function () {
  if (window.__vivaciHomeFeaturedLoaded) return;
  window.__vivaciHomeFeaturedLoaded = true;

  var DATA_URL = "/content/from-production/home-featured-treatments.json";

  function fillSlide(templateSlide, item) {
    var slide = templateSlide.cloneNode(true);
    slide.removeAttribute("hidden");
    slide.removeAttribute("data-vivaci-related-slide-template");

    if (window.vivaciHydrateTreatmentCard) {
      window.vivaciHydrateTreatmentCard(slide, item, { linkMode: "overlay" });
      return slide;
    }

    var card = slide.querySelector(".layout527_card-large");
    if (!card) return slide;
    var href = item.href || "#";
    var img = card.querySelector(".layout527_background-image");
    if (img && item.image) {
      img.src = item.image;
      img.alt = item.name || "";
    }
    var title = card.querySelector(".heading-medium, .heading-style-h6");
    if (title) title.textContent = item.name || "";
    var overlay = document.createElement("a");
    overlay.href = href;
    overlay.className = "layout527_card-hit";
    overlay.setAttribute("aria-label", item.name || "");
    card.appendChild(overlay);

    return slide;
  }

  function destroySwiperTuesdayEl(swiperEl) {
    if (!swiperEl) return;
    if (swiperEl.swiper && !swiperEl.swiper.destroyed) {
      swiperEl.swiper.destroy(true, true);
    }
    delete swiperEl.dataset.vivaciSwiperTuesdayInit;
    var controls = swiperEl.nextElementSibling;
    if (controls && controls.classList.contains("swiper-tuesday-controls")) {
      controls.remove();
    }
  }

  /**
   * Mount homepage-style treatment cards in a .swiper-tuesday (shared with treatment PDP).
   * @param {HTMLElement} sectionRoot section or container with swiper + slide template
   * @param {Array<{name?: string, title?: string, href?: string, image?: string}>} items
   */
  window.vivaciMountFeaturedTreatmentSlider = function (sectionRoot, items) {
    if (!sectionRoot || !items || !items.length) return;
    var swiperEl =
      sectionRoot.querySelector('[data-vivaci-field="related-swiper"]') ||
      sectionRoot.querySelector(".swiper-tuesday");
    if (!swiperEl) return;
    var wrapper =
      sectionRoot.querySelector('[data-vivaci-field="related-slides"]') ||
      swiperEl.querySelector(".swiper-wrapper");
    if (!wrapper) return;
    var templateSlide =
      wrapper.querySelector("[data-vivaci-related-slide-template]") ||
      wrapper.querySelector(".swiper-slide");
    if (!templateSlide) return;

    destroySwiperTuesdayEl(swiperEl);
    wrapper.innerHTML = "";
    items.forEach(function (item) {
      wrapper.appendChild(fillSlide(templateSlide, item));
    });
    if (typeof window.vivaciInitSwiperTuesdayEl === "function") {
      window.vivaciInitSwiperTuesdayEl(swiperEl);
    }
  };

  function apply(data, root) {
    if (!root || !data) return;

    var intro = root.querySelector('[data-vivaci-field="featured-intro"]');
    if (intro && data.intro) intro.textContent = data.intro;

    var cta = root.querySelector('[data-vivaci-field="featured-cta"]');
    if (cta && data.cta) {
      if (data.cta.href) cta.href = data.cta.href;
      var label = cta.querySelector("div");
      if (label && data.cta.label) label.textContent = data.cta.label;
    }

    var items = data.items || [];
    if (!items.length) return;

    var lookup = window.__vivaciTreatmentImageForHref;
    items.forEach(function (item) {
      if (lookup && item.href) {
        var mapped = lookup(item.href);
        item.image =
          mapped ||
          (item.image &&
          String(item.image).indexOf("/images/ak/treatments/") === 0
            ? item.image
            : "");
      }
    });
    window.vivaciMountFeaturedTreatmentSlider(root, items);
  }

  function hydrate() {
    var root = document.getElementById("vivaci-home-featured-treatments");
    if (!root) return Promise.resolve();

    return Promise.resolve(window.__vivaciTreatmentImagesReady)
      .then(function () {
        return window.vivaciFetchJson
          ? window.vivaciFetchJson(DATA_URL)
          : fetch(DATA_URL).then(function (res) {
              if (!res.ok) throw new Error("home-featured-treatments.json " + res.status);
              return res.json();
            });
      })
      .then(function (data) {
        apply(data, root);
      })
      .catch(function (err) {
        console.warn("[vivaci] featured treatments:", err);
      });
  }

  window.__vivaciHomeFeaturedReady = window.vivaciOnLocaleContentReady
    ? new Promise(function (resolve) {
        window.vivaciOnLocaleContentReady(function () {
          return hydrate().then(resolve);
        });
      })
    : hydrate();
})();
