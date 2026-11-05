/**
 * Non-treatment stock images from content/placeholders.json (local /images/stock).
 * Treatment imagery comes from Railway — vivaci-treatment-images.js + featured slider.
 * Skips #vivaci-home-problems (Railway hudproblem images).
 */
(function () {
  if (window.__vivaciPlaceholdersLoaded) return;
  window.__vivaciPlaceholdersLoaded = true;

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
      setImg(img, path(catalog, id), "");
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

    applyPool(
      Array.prototype.slice.call(document.querySelectorAll(".team8_image")),
      catalog.pools.team || [],
      catalog
    );

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

    setImg(
      document.querySelector(".header6_background-image"),
      path(catalog, "cta-bottom"),
      ""
    );
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
