/**
 * /produkter — product grid from synced Shopify JSON.
 */
(function () {
  if (window.__vivaciShopWebshopLoaded) return;
  window.__vivaciShopWebshopLoaded = true;

  var DATA_URL = "/content/shopify/products.json";
  var FILTER_ANIM_MS = 220;
  var activeCategory = "Alla";
  var allProducts = [];
  var cardTemplate = null;
  var paintQueued = false;
  var gridRenderToken = 0;
  var shopHydrated = false;

  function money(p) {
    if (!p) return "";
    return window.VivaciShopifyCart
      ? window.VivaciShopifyCart.formatMoney(p.amount, p.currencyCode)
      : p.amount + " " + (p.currencyCode || "");
  }

  function categoriesFromProducts(products) {
    var counts = Object.create(null);
    products.forEach(function (p) {
      (p.collections || []).forEach(function (c) {
        if (!c || /^hello$/i.test(c)) return;
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return ["Alla"].concat(
      Object.keys(counts)
        .filter(function (c) {
          return counts[c] > 0;
        })
        .sort(function (a, b) {
          return a.localeCompare(b, "sv");
        })
    );
  }

  function productsForCategory(products, category) {
    if (category === "Alla") return products.slice();
    return products.filter(function (p) {
      return (p.collections || []).indexOf(category) >= 0;
    });
  }

  function defaultVariantId(product) {
    var variants = (product && product.variants) || [];
    var pick =
      variants.find(function (v) {
        return v && v.availableForSale && v.id;
      }) || variants[0];
    return pick && pick.id;
  }

  function fillCard(template, product, index) {
    var card = template.content.firstElementChild.cloneNode(true);
    var link = card.querySelector(".product4_item-link") || card;
    link.classList.add("is-clickable");
    link.addEventListener("click", function (e) {
      if (e.target.closest("button, .button")) return;
      window.location.href = product.href;
    });

    var img = card.querySelector(".product4_image");
    var imgReady = Promise.resolve();
    if (img && product.image) {
      var eager = typeof index === "number" && index < 8;
      img.loading = eager ? "eager" : "lazy";
      if (window.VivaciImage) {
        imgReady = window.VivaciImage.apply(img, product.image, product.imageAlt || product.title || "", {
          loading: img.loading,
          fetchPriority: eager ? "high" : "auto",
        });
      } else {
        img.src = product.image;
        img.alt = product.imageAlt || product.title || "";
      }
    } else if (img) {
      img.src = "images/placeholder-image.svg";
    }
    var titleEl = card.querySelector(".product4_title-wrapper .text-size-regular");
    if (titleEl) titleEl.textContent = product.title || "";
    var priceEl = card.querySelector(".product4_title-wrapper .text-size-small");
    if (priceEl) priceEl.textContent = money(product.price);

    var btn = card.querySelector(".product4_content-bottom .button");
    if (btn) {
      btn.textContent = "Lägg i varukorg";
      btn.setAttribute(
        "aria-label",
        "Lägg " + (product.title || "produkten") + " i varukorgen"
      );
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var variantId = defaultVariantId(product);
        if (!variantId || !window.VivaciShopifyCart) {
          window.location.href = product.href;
          return;
        }
        window.VivaciShopifyCart.addVariant(variantId, 1)
          .then(function () {
            window.VivaciShopifyCart.openDrawer();
          })
          .catch(function (err) {
            alert(err.message || "Kunde inte lägga till i varukorgen.");
          });
      });
    }
    return { card: card, imgReady: imgReady };
  }

  function updateCounts(root, shown, total) {
    var countEl =
      root.querySelector("[data-vivaci-shop-results-count]") ||
      root.querySelector('[fs-cmsfilter-element="results-count"]');
    var totalEl =
      root.querySelector("[data-vivaci-shop-items-count]") ||
      root.querySelector('[fs-cmsfilter-element="items-count"]');
    if (countEl) countEl.textContent = String(shown);
    if (totalEl) totalEl.textContent = String(total);
  }

  function setActiveFilterLink(container, category) {
    if (!container) return;
    container.querySelectorAll(".filters2_category-link").forEach(function (el) {
      el.classList.toggle("is-active", el.dataset.category === category);
      el.setAttribute("aria-current", el.dataset.category === category ? "true" : "false");
    });
  }

  function renderCategories(categories, container, onSelect) {
    if (!container) return;
    container.innerHTML = "";
    categories.forEach(function (cat) {
      var a = document.createElement("a");
      a.href = "#";
      a.className = "filters2_category-link is-vivaci-filter-chip";
      a.dataset.category = cat;
      a.setAttribute("role", "listitem");
      a.textContent = cat;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        onSelect(cat);
      });
      container.appendChild(a);
    });
    setActiveFilterLink(container, activeCategory);
  }

  function renderGridAnimated(products, grid, template, root, onDone) {
    var token = ++gridRenderToken;
    var reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var existing = Array.prototype.slice.call(grid.querySelectorAll(".product4_item"));

    function insertCards() {
      if (token !== gridRenderToken) return;
      grid.innerHTML = "";
      if (!products.length) {
        var empty = document.createElement("p");
        empty.className = "text-size-regular vivaci-shop-empty";
        empty.textContent = "Inga produkter i den här kategorin just nu.";
        grid.appendChild(empty);
        updateCounts(root, 0, allProducts.length);
        grid.classList.remove("is-filtering");
        if (onDone) onDone();
        return;
      }

      var built = products.map(function (p, index) {
        return fillCard(template, p, index);
      });
      Promise.all(built.map(function (b) { return b.imgReady; })).then(function () {
        if (token !== gridRenderToken) return;
        built.forEach(function (b, index) {
          var card = b.card;
          if (!reduced) {
            card.classList.add("vivaci-shop-card-enter");
            card.style.animationDelay = Math.min(index * 45, 360) + "ms";
          }
          grid.appendChild(card);
        });
        updateCounts(root, products.length, allProducts.length);
        grid.classList.remove("is-filtering");
        if (onDone) onDone();
      });
    }

    if (!existing.length || reduced) {
      grid.classList.add("is-filtering");
      insertCards();
      return;
    }

    grid.classList.add("is-filtering");
    existing.forEach(function (card) {
      card.classList.add("vivaci-shop-card-exit");
    });
    window.setTimeout(insertCards, FILTER_ANIM_MS);
  }

  function hydrate() {
    var root = document.getElementById("vivaci-shop");
    if (!root) return Promise.resolve();
    if (shopHydrated) return Promise.resolve();

    cardTemplate = document.getElementById("vivaci-product-card-template");
    var grid = root.querySelector("[data-vivaci-shop-grid]") || root.querySelector(".product4_list");
    var categoryList =
      root.querySelector("[data-vivaci-shop-category-list]") ||
      root.querySelector(".filters2_category-list");

    if (!grid || !cardTemplate) return Promise.resolve();

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(DATA_URL)
      : fetch(DATA_URL).then(function (res) {
          if (!res.ok) throw new Error("products.json missing — run pull-shopify-products.py");
          return res.json();
        });
    return req
      .then(function (data) {
        shopHydrated = true;
        allProducts = data.products || [];
        var categories = categoriesFromProducts(allProducts);
        if (categories.length === 1 && (data.categories || []).length > 1) {
          categories = (data.categories || ["Alla"]).filter(function (c) {
            return c !== "hello";
          });
        }

        function selectCategory(cat) {
          activeCategory = cat;
          setActiveFilterLink(categoryList, cat);
          paint();
        }

        renderCategories(categories, categoryList, selectCategory);

        var resetBtn = root.querySelector("[data-vivaci-shop-filter-reset]");
        if (resetBtn) {
          resetBtn.addEventListener("click", function (e) {
            e.preventDefault();
            selectCategory("Alla");
          });
        }
        var applyBtn = root.querySelector("[data-vivaci-shop-filter-apply]");
        if (applyBtn) {
          applyBtn.addEventListener("click", function (e) {
            e.preventDefault();
            var close = root.querySelector(".filters2_tablet-modal-close-button");
            if (close) close.click();
          });
        }

        function paint() {
          if (paintQueued) return;
          paintQueued = true;
          window.requestAnimationFrame(function () {
            paintQueued = false;
            var filtered = productsForCategory(allProducts, activeCategory);
            renderGridAnimated(filtered, grid, cardTemplate, root);
          });
        }

        paint();
      })
      .catch(function (err) {
        console.warn("[vivaci] Webshop:", err);
      });
  }

  function boot() {
    return hydrate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (window.vivaciOnLocaleContentReady) {
        window.vivaciOnLocaleContentReady(boot);
      } else {
        boot();
      }
    });
  } else if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(boot);
  } else {
    boot();
  }
})();
