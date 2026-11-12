/**
 * Non-treatment stock images from content/placeholders.json (local /images/stock).
 * Treatment imagery comes from Railway — vivaci-treatment-images.js + featured slider.
 * Skips #vivaci-home-problems (Railway hudproblem images).
 */
(function () {
  if (window.__vivaciPlaceholdersLoaded) return;
  window.__vivaciPlaceholdersLoaded = true;

  if (document.documentElement.getAttribute("data-vivaci-course-hydrated")) {
    window.__vivaciPlaceholdersReady = Promise.resolve();
    return;
  }

  var CATALOG_URL = "/content/placeholders.json";

  function setImg(img, path, alt) {
    if (!img || !path) return;
    if (img.closest("#vivaci-shop") || img.closest("#vivaci-product")) return;
    try {
      var current = img.currentSrc || img.getAttribute("src") || "";
      if (current.indexOf(path) !== -1) return;
    } catch (_) {}
    img.src = path;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    if (alt) img.alt = alt;
  }

  function path(catalog, id) {
    var item = catalog.items && catalog.items[id];
    return item && item.path;
  }

  function applyPool(imgs, ids, catalog) {
    if (!imgs.length || !ids.length) return;
    imgs.forEach(function (img, i) {
      var id = ids[i % ids.length];
      var item = catalog.items && catalog.items[id];
      setImg(img, path(catalog, id), (item && item.label) || "");
    });
  }

  function setTeamCardText(card, item) {
    if (!card || !item) return;
    var wrap = card.querySelector(".team8_title-wrapper");
    if (!wrap) return;
    var nameEl = wrap.querySelector(
      ".text-weight-bold, .text-size-medium, .text-size-regular"
    );
    var roleEl = wrap.querySelector(".text-size-small");
    if (nameEl && item.label) nameEl.textContent = item.label;
    if (roleEl && item.role) roleEl.textContent = item.role;
  }

  function applyTeamCards(catalog) {
    var ids = (catalog.pools && catalog.pools.team) || [];
    if (!ids.length) return;
    var items = catalog.items || {};
    var cards = Array.prototype.slice.call(
      document.querySelectorAll(".team8_list .team8_item")
    );
    if (!cards.length) {
      applyPool(
        Array.prototype.slice.call(document.querySelectorAll(".team8_image")),
        ids,
        catalog
      );
      return;
    }
    cards.forEach(function (card, i) {
      var id = ids[i % ids.length];
      var item = items[id];
      if (!item) return;
      var img = card.querySelector(".team8_image");
      setImg(img, item.path, item.label || "");
      setTeamCardText(card, item);
    });
  }

  function apply(catalog) {
    if (!catalog || !catalog.items) return;

    /* Homepage hero keeps export image (Morpheus8) — do not replace. */

    setImg(
      document.querySelector(".header37_image"),
      path(catalog, "section-plastikkirurgi"),
      "Plastikkirurgi"
    );
    setImg(
      document.querySelector(".header36_image"),
      path(catalog, "section-method"),
      "Vår metod"
    );

    applyTeamCards(catalog);

    applyPool(
      Array.prototype.slice.call(document.querySelectorAll(".blog34_image")),
      catalog.pools.blogCarousel || [],
      catalog
    );

    var navBlogImgs = Array.prototype.slice.call(
      document.querySelectorAll(".navbar10_blog-item-image")
    );
    applyPool(navBlogImgs, catalog.pools.navBlog || [], catalog);

    setImg(
      document.querySelector(".blog-post3-content_author-image"),
      path(catalog, "blog-author"),
      ""
    );

    if (window.location.pathname.indexOf("/produkter") !== 0) {
      applyPool(
        Array.prototype.slice.call(document.querySelectorAll(".product4_image")),
        catalog.pools.products || [],
        catalog
      );
      setImg(
        document.querySelector(".product-header1_image"),
        path(catalog, "product-1"),
        ""
      );
      applyPool(
        Array.prototype.slice.call(
          document.querySelectorAll('img[src*="placeholder-image.svg"]')
        ),
        catalog.pools.products || [],
        catalog
      );
    }

    var ctaPath = path(catalog, "cta-bottom");
    var ctaItem = catalog.items && catalog.items["cta-bottom"];
    var ctaLabel = (ctaItem && ctaItem.label) || "";
    document.querySelectorAll(".header6_background-image").forEach(function (img) {
      setImg(img, ctaPath, ctaLabel);
    });
  }

  function hydrate() {
    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(CATALOG_URL)
      : fetch(CATALOG_URL).then(function (res) {
          if (!res.ok) throw new Error("placeholders.json " + res.status);
          return res.json();
        });
    return req
      .then(function (catalog) {
        apply(catalog);
        return catalog;
      })
      .catch(function (err) {
        console.warn("[vivaci] placeholders:", err);
      });
  }

  window.__vivaciPlaceholdersReady = window.vivaciOnLocaleContentReady
    ? window.vivaciOnLocaleContentReady(hydrate)
    : hydrate();
})();
