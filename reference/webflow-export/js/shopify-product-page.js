/**
 * /produkter/{handle} — product detail + add to cart.
 */
(function () {
  if (window.__vivaciShopProductLoaded) return;
  window.__vivaciShopProductLoaded = true;

  var DATA_URL = "/content/shopify/products.json";

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

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(DATA_URL)
      : fetch(DATA_URL).then(function (res) {
          return res.json();
        });
    return req
      .then(function (data) {
        var product = (data.products || []).find(function (p) { return p.handle === handle; });
        if (!product) return;

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
        if (addBtn) {
          addBtn.textContent = "Lägg i varukorg";
          addBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (!selectedVariantId || !window.VivaciShopifyCart) return;
            window.VivaciShopifyCart.addVariant(selectedVariantId, 1).then(function () {
              window.VivaciShopifyCart.openDrawer();
            }).catch(function (err) {
              alert(err.message || "Kunde inte lägga till i varukorgen.");
            });
          });
        }
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
