/**
 * /produkter/{handle} — product detail + add to cart.
 */
(function () {
  if (window.__vivaciShopProductLoaded) return;
  window.__vivaciShopProductLoaded = true;

  var DATA_URL = "/content/shopify/products.json";
  var REC_MIN = 2;
  var REC_MAX = 32;

  function defaultVariantId(product) {
    var variants = (product && product.variants) || [];
    var pick =
      variants.find(function (v) {
        return v && v.availableForSale && v.id;
      }) || variants[0];
    return pick && pick.id;
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

  function recommendedProducts(current, catalog) {
    var handle = current && current.handle;
    var collections = (current && current.collections) || [];
    var primary = collections.filter(function (c) {
      return c && c !== "hello" && c !== "Alla";
    });
    var sameCategory = [];
    var other = [];
    (catalog || []).forEach(function (p) {
      if (!p || !p.handle || p.handle === handle) return;
      var shared = (p.collections || []).filter(function (c) {
        return primary.indexOf(c) >= 0;
      }).length;
      if (shared > 0) sameCategory.push(p);
      else other.push(p);
    });
    var byTitle = function (a, b) {
      return (a.title || "").localeCompare(b.title || "", "sv");
    };
    sameCategory.sort(byTitle);
    other.sort(byTitle);
    return sameCategory.concat(other).slice(0, REC_MAX);
  }

  function fillRecommendedSlide(slide, product) {
    if (!slide || !product) return;
    var card = slide.querySelector(".product4_item");
    if (!card) return;
    var link = card.querySelector(".product4_item-link") || card;
    link.classList.add("is-clickable");
    if (!link.dataset.vivaciRecBound) {
      link.dataset.vivaciRecBound = "1";
      link.addEventListener("click", function (e) {
        if (e.target.closest("button, .button")) return;
        window.location.href = product.href;
      });
    }
    var img = card.querySelector(".product4_image");
    if (img && product.image) {
      if (window.VivaciImage) {
        window.VivaciImage.apply(img, product.image, product.imageAlt || product.title || "", {
          loading: "lazy",
        });
      } else {
        img.src = product.image;
        img.alt = product.imageAlt || product.title || "";
      }
    }
    var titleEl = card.querySelector(".product4_title-wrapper .text-size-regular");
    if (titleEl) titleEl.textContent = product.title || "";
    var priceEl = card.querySelector(".product4_title-wrapper .text-size-small");
    if (priceEl) priceEl.textContent = money(product.price);
    var btn = card.querySelector(".product4_content-bottom .button");
    if (btn && !btn.dataset.vivaciRecCartBound) {
      btn.dataset.vivaciRecCartBound = "1";
      btn.textContent = "Lägg i varukorg";
      btn.href = product.href || "#";
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
  }

  function fillRecommendedSlider(current, catalog) {
    var section = document.querySelector("[data-vivaci-product-recommended]");
    if (!section) return;
    var items = recommendedProducts(current, catalog);
    if (items.length < 2) {
      section.hidden = true;
      return;
    }
    var wrapper = section.querySelector('[data-vivaci-field="product-rec-slides"]');
    var swiperEl = section.querySelector('[data-vivaci-field="product-rec-swiper"]');
    var template = section.querySelector("[data-vivaci-product-rec-slide-template]");
    if (!wrapper || !swiperEl || !template) return;
    var templateHtml = template.outerHTML;
    destroySwiperTuesdayEl(swiperEl);
    wrapper.innerHTML = "";
    items.forEach(function (product) {
      var mount = document.createElement("div");
      mount.innerHTML = templateHtml;
      var slide = mount.firstElementChild;
      if (!slide) return;
      slide.removeAttribute("hidden");
      slide.removeAttribute("data-vivaci-product-rec-slide-template");
      fillRecommendedSlide(slide, product);
      wrapper.appendChild(slide);
    });
    section.hidden = false;
    if (typeof window.vivaciInitSwiperTuesdayEl === "function") {
      window.vivaciInitSwiperTuesdayEl(swiperEl);
    }
  }

  function handleFromPath() {
    var m = window.location.pathname.match(/\/produkter\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function money(p) {
    if (!p) return "";
    return window.VivaciShopifyCart.formatMoney(p.amount, p.currencyCode);
  }

  function plainDescription(text) {
    if (!text) return "";
    return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  /** Current page title is shown in the H1 — drop the trailing crumb. */
  function trimCurrentBreadcrumb(container) {
    if (!container) return;
    var links = container.querySelectorAll(".breadcrumb-link");
    if (links.length < 2) return;
    var last = links[links.length - 1];
    var prev = last.previousElementSibling;
    if (prev && prev.classList.contains("breadcrumb-divider")) {
      prev.remove();
    }
    last.remove();
  }

  function initStaticAccordions(root) {
    root.querySelectorAll(".product-header1_accordion").forEach(function (acc) {
      var heading = acc.querySelector(".product-header1_heading");
      if (!heading || heading.hasAttribute("data-w-id")) return;
      if (heading.getAttribute("data-vivaci-accordion-bound") === "true") return;
      var details = acc.querySelector(".product-header1_details");
      if (!details) return;

      heading.setAttribute("data-vivaci-accordion-bound", "true");
      heading.setAttribute("role", "button");
      heading.setAttribute("tabindex", "0");
      heading.setAttribute("aria-expanded", "false");

      function toggle() {
        var closed =
          !details.style.height || details.style.height === "0px";
        details.style.height = closed ? "auto" : "0px";
        heading.setAttribute("aria-expanded", closed ? "true" : "false");
        acc.classList.toggle("is-open", closed);
      }

      heading.addEventListener("click", toggle);
      heading.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function wireProductQuantity(root, getQty, setQty) {
    var qtyRoot = root.querySelector("[data-vivaci-product-qty]");
    var qtySpan = root.querySelector("[data-vivaci-qty-value]");
    if (!qtyRoot || !qtySpan) return;
    var minusBtn = qtyRoot.querySelector('[data-qty-delta="-1"]');
    var plusBtn = qtyRoot.querySelector('[data-qty-delta="1"]');

    function paintQty() {
      var q = getQty();
      qtySpan.textContent = String(q);
      if (minusBtn) minusBtn.disabled = q <= 1;
      if (plusBtn) plusBtn.disabled = q >= 99;
    }

    qtyRoot.querySelectorAll("[data-qty-delta]").forEach(function (btn) {
      if (btn.dataset.vivaciQtyBound === "1") return;
      btn.dataset.vivaciQtyBound = "1";
      btn.addEventListener("click", function () {
        var delta = parseInt(btn.getAttribute("data-qty-delta"), 10) || 0;
        var next = Math.max(1, Math.min(99, getQty() + delta));
        setQty(next);
        paintQty();
      });
    });
    paintQty();
  }

  function setProductCopy(root, product) {
    var lead = root.querySelector("[data-vivaci-product-lead]");
    var details = root.querySelector("[data-vivaci-product-details]");
    var desc = product.description || "";
    if (lead) {
      lead.textContent = plainDescription(desc).slice(0, 280);
      lead.hidden = !desc;
    }
    if (details) {
      if (desc.indexOf("<") !== -1) {
        details.innerHTML = desc;
      } else {
        details.textContent = desc;
      }
      var accordion = details.closest(".product-header1_accordion");
      if (accordion) accordion.hidden = !desc;
    }
  }

  function hydrate() {
    var root = document.getElementById("vivaci-product");
    if (!root) return Promise.resolve();
    initStaticAccordions(root);
    var handle = handleFromPath();
    if (!handle) return Promise.resolve();
    if (root.dataset.vivaciProductHydrated === handle) return Promise.resolve();

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(DATA_URL)
      : fetch(DATA_URL).then(function (res) {
          return res.json();
        });
    return req
      .then(function (data) {
        var product = (data.products || []).find(function (p) { return p.handle === handle; });
        if (!product) return;
        root.dataset.vivaciProductHydrated = handle;

        var h1 = root.querySelector(".product-header1_product-details h1");
        if (h1) h1.textContent = product.title;
        document.title = product.title + " — Vivaci";
        var priceEl = root.querySelector(".product-header1_product-details .heading-style-h5-7");
        if (priceEl) priceEl.textContent = money(product.price);
        setProductCopy(root, product);
        var img = root.querySelector(".product-header1_image");
        if (img && product.image) {
          if (window.VivaciImage) {
            window.VivaciImage.apply(img, product.image, product.imageAlt || product.title, {
              loading: "eager",
              fetchPriority: "high",
            });
          } else {
            img.src = product.image;
            img.alt = product.imageAlt || product.title;
          }
        }

        var crumbBar = root.querySelector(".breadcrumb_component");
        var crumbs = root.querySelectorAll(".breadcrumb-link div");
        if (crumbs[0]) crumbs[0].textContent = "Alla produkter";
        if (crumbs[1]) crumbs[1].textContent = product.productType || "Produkter";
        trimCurrentBreadcrumb(crumbBar);
        root.querySelectorAll(".breadcrumb-link").forEach(function (a, i) {
          if (i === 0) a.href = "/produkter";
        });

        var variants = product.variants || [];
        var selectedVariantId = variants[0] && variants[0].id;
        var quantity = 1;
        wireProductQuantity(
          root,
          function () {
            return quantity;
          },
          function (n) {
            quantity = n;
          }
        );
        var selectWrap = root.querySelector(".product-header1_option-list");

        if (selectWrap && variants.length > 1) {
          selectWrap.innerHTML =
            '<div class="product-header1_option"><div class="form_field-label">Variant</div>' +
            '<div class="form-select-wrapper"><select class="form_input is-select-input w-select" data-vivaci-variant-select></select></div></div>';
          var sel = selectWrap.querySelector("[data-vivaci-variant-select]");
          variants.forEach(function (v) {
            var opt = document.createElement("option");
            opt.value = v.id;
            opt.textContent = v.title + (v.availableForSale ? "" : " (slut)");
            opt.disabled = !v.availableForSale;
            sel.appendChild(opt);
          });
          sel.addEventListener("change", function () {
            selectedVariantId = sel.value;
            var v = variants.find(function (item) { return item.id === selectedVariantId; });
            if (v && v.price && priceEl) priceEl.textContent = money(v.price);
          });
          selectedVariantId = sel.value;
        } else if (selectWrap) {
          selectWrap.innerHTML = "";
        }

        var addBtn = root.querySelector(".is-add-to-cart-button");
        if (addBtn && !addBtn.dataset.vivaciCartBound) {
          addBtn.dataset.vivaciCartBound = "1";
          addBtn.textContent = "Lägg i varukorg";
          addBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (!selectedVariantId || !window.VivaciShopifyCart) return;
            window.VivaciShopifyCart.addVariant(selectedVariantId, quantity).then(function () {
              window.VivaciShopifyCart.openDrawer();
            }).catch(function (err) {
              alert(err.message || "Kunde inte lägga till i varukorgen.");
            });
          });
        }

        fillRecommendedSlider(product, data.products || []);
      })
      .catch(function (err) {
        console.warn("[vivaci] Product page:", err);
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
