/**
 * Utvalda behandlingar — copy + Railway images from home-featured-treatments.json.
 */
(function () {
  if (window.__vivaciHomeFeaturedLoaded) return;
  window.__vivaciHomeFeaturedLoaded = true;

  var DATA_URL = "/content/from-production/home-featured-treatments.json";

  function setImg(img, src, alt) {
    if (!img || !src) return;
    img.src = src;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    if (alt) img.alt = alt;
  }

  function fillSlide(templateSlide, item) {
    var slide = templateSlide.cloneNode(true);
    var card = slide.querySelector(".layout527_card-large");
    if (!card) return slide;

    var href = item.href || "#";
    setImg(
      card.querySelector(".layout527_background-image"),
      item.image,
      item.name || ""
    );

    var title = card.querySelector(".heading-medium, .heading-style-h6");
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

    var wrapper = root.querySelector(".swiper-tuesday .swiper-wrapper");
    if (!wrapper) return;
    var templateSlide = wrapper.querySelector(".swiper-slide");
    if (!templateSlide) return;

    wrapper.innerHTML = "";
    items.forEach(function (item) {
      wrapper.appendChild(fillSlide(templateSlide, item));
    });
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
        var lookup = window.__vivaciTreatmentImageForHref;
        (data.items || []).forEach(function (item) {
          if (lookup && item.href) {
            item.image = lookup(item.href) || item.image;
          }
        });
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
