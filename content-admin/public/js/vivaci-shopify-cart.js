/**
 * Shopify cart (Storefront Cart API) + drawer UI.
 */
(function () {
  if (!document.querySelector('script[src*="vivaci-i18n"]')) {
    var i18nBoot = document.createElement("script");
    i18nBoot.src = "/js/vivaci-i18n.js";
    i18nBoot.defer = true;
    document.head.appendChild(i18nBoot);
  }
  if (!document.querySelector('script[src*="vivaci-nav-actions"]')) {
    var boot = document.createElement("script");
    boot.src = "/js/vivaci-nav-actions.js";
    boot.defer = true;
    document.head.appendChild(boot);
  }

  function ui(key, fallback) {
    if (window.VivaciI18n && window.VivaciI18n.t) {
      return window.VivaciI18n.t(key, null, fallback);
    }
    return fallback;
  }
  if (window.__vivaciShopifyCartLoaded) return;
  window.__vivaciShopifyCartLoaded = true;

  var CART_KEY = "vivaci_shopify_cart_id";
  var CART_QTY_KEY = "vivaci_cart_last_qty";
  var cartHydrated = false;

  function emitCartHydrated() {
    if (cartHydrated) return;
    cartHydrated = true;
    window.__vivaciCartHydrated = true;
    document.dispatchEvent(new CustomEvent("vivaci:cart-hydrated"));
  }
  var cartState = { cart: null, loading: false };
  var lineSyncTimers = Object.create(null);
  var lineSyncQty = Object.create(null);
  var lineSyncGen = Object.create(null);
  var LINE_SYNC_MS = 180;

  var CART_FRAGMENT = `
    fragment CartFields on Cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount { amount currencyCode }
        totalAmount { amount currencyCode }
      }
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                image { url altText }
                product { title handle }
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  `;

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function formatMoney(amount, code) {
    var n = parseFloat(amount);
    if (!isFinite(n)) return amount + " " + (code || "");
    try {
      return new Intl.NumberFormat("sv-SE", {
        style: "currency",
        currency: code || "SEK",
        maximumFractionDigits: 0,
      }).format(n);
    } catch (e) {
      return Math.round(n) + " " + (code || "SEK");
    }
  }

  function getCartId() {
    try {
      return localStorage.getItem(CART_KEY);
    } catch (e) {
      return null;
    }
  }

  function setCartId(id) {
    try {
      if (id) localStorage.setItem(CART_KEY, id);
      else localStorage.removeItem(CART_KEY);
    } catch (e) {}
  }

  function normalizeCart(cart, soft) {
    cartState.cart = cart;
    if (soft) {
      updateFooterFromCart(cart);
      return cart;
    }
    emit("vivaci:cart-updated", { cart: cart });
    return cart;
  }

  function fetchCart(id) {
    var q =
      CART_FRAGMENT +
      "query Cart($id: ID!) { cart(id: $id) { ...CartFields } }";
    return window.VivaciShopify.graphql(q, { id: id }).then(function (data) {
      if (!data.cart) {
        setCartId(null);
        cartState.cart = null;
        emit("vivaci:cart-updated", { cart: null });
        return null;
      }
      return normalizeCart(data.cart);
    });
  }

  function createCart(lines) {
    var q =
      CART_FRAGMENT +
      "mutation Create($input: CartInput!) { cartCreate(input: $input) { cart { ...CartFields } userErrors { message field } } }";
    return window.VivaciShopify.graphql(q, {
      input: { lines: lines || [] },
    }).then(function (data) {
      var payload = data.cartCreate;
      if (payload.userErrors && payload.userErrors.length) {
        throw new Error(payload.userErrors[0].message);
      }
      setCartId(payload.cart.id);
      return normalizeCart(payload.cart);
    });
  }

  function addLines(lines) {
    var id = getCartId();
    if (!id) {
      return createCart(lines);
    }
    var q =
      CART_FRAGMENT +
      "mutation Add($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } } }";
    return window.VivaciShopify.graphql(q, { cartId: id, lines: lines }).then(function (data) {
      var payload = data.cartLinesAdd;
      if (payload.userErrors && payload.userErrors.length) {
        throw new Error(payload.userErrors[0].message);
      }
      return normalizeCart(payload.cart);
    });
  }

  function updateLine(lineId, quantity, soft) {
    var id = getCartId();
    if (!id) return Promise.resolve(null);
    var q =
      CART_FRAGMENT +
      "mutation Upd($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } } }";
    return window.VivaciShopify.graphql(q, {
      cartId: id,
      lines: [{ id: lineId, quantity: quantity }],
    }).then(function (data) {
      var payload = data.cartLinesUpdate;
      if (payload.userErrors && payload.userErrors.length) {
        throw new Error(payload.userErrors[0].message);
      }
      return normalizeCart(payload.cart, soft);
    });
  }

  function initCart() {
    var id = getCartId();
    if (!id) {
      cartState.cart = null;
      emit("vivaci:cart-updated", { cart: null });
      return Promise.resolve(null);
    }
    return fetchCart(id).catch(function () {
      setCartId(null);
      return null;
    });
  }

  function addVariant(variantId, quantity) {
    cartState.loading = true;
    emit("vivaci:cart-loading", { loading: true });
    return addLines([{ merchandiseId: variantId, quantity: quantity || 1 }])
      .finally(function () {
        cartState.loading = false;
        emit("vivaci:cart-loading", { loading: false });
      });
  }

  function removeLine(lineId) {
    return updateLine(lineId, 0);
  }

  function cartLineEdges(cart) {
    return (cart && cart.lines && cart.lines.edges) || [];
  }

  function findCartLineIndex(cart, lineId) {
    var edges = cartLineEdges(cart);
    for (var i = 0; i < edges.length; i++) {
      if (edges[i].node.id === lineId) return i;
    }
    return -1;
  }

  function sumCartQuantity(cart) {
    var total = 0;
    cartLineEdges(cart).forEach(function (edge) {
      total += edge.node.quantity;
    });
    return total;
  }

  function estimateSubtotal(cart) {
    var sum = 0;
    var code = "SEK";
    cartLineEdges(cart).forEach(function (edge) {
      var node = edge.node;
      var price = node.merchandise && node.merchandise.price;
      if (!price) return;
      sum += parseFloat(price.amount) * node.quantity;
      code = price.currencyCode || code;
    });
    return { amount: sum, currencyCode: code };
  }

  function patchLineInDom(lineId, quantity, unitAmount, currencyCode) {
    var row = document.querySelector(
      '.vivaci-cart-line[data-line-id="' + lineId.replace(/"/g, '\\"') + '"]'
    );
    if (!row) return;
    var span = row.querySelector(".vivaci-cart-qty span");
    if (span) span.textContent = String(quantity);
    var priceEl = row.querySelector(".vivaci-cart-line__price");
    if (priceEl) {
      priceEl.textContent = formatMoney(unitAmount * quantity, currencyCode);
    }
  }

  function updateFooterFromCart(cart) {
    var sub = document.querySelector("[data-vivaci-cart-subtotal]");
    if (!cart || !cart.totalQuantity) {
      if (sub) sub.textContent = formatMoney(0, "SEK");
      updateTrigger(0);
      return;
    }
    var subAmt = (cart.cost && cart.cost.subtotalAmount) || estimateSubtotal(cart);
    if (sub) {
      sub.textContent = formatMoney(subAmt.amount, subAmt.currencyCode);
    }
    updateTrigger(cart.totalQuantity);
  }

  function optimisticApplyQuantity(lineId, quantity) {
    var cart = cartState.cart;
    if (!cart) return;

    var idx = findCartLineIndex(cart, lineId);
    if (idx < 0) return;

    var node = cartLineEdges(cart)[idx].node;
    var unit = parseFloat(node.merchandise.price.amount);
    var currency = node.merchandise.price.currencyCode;

    if (quantity <= 0) {
      cartLineEdges(cart).splice(idx, 1);
      cart.totalQuantity = sumCartQuantity(cart);
      var row = document.querySelector(
        '.vivaci-cart-line[data-line-id="' + lineId.replace(/"/g, '\\"') + '"]'
      );
      if (row) row.remove();
      if (!cart.totalQuantity) {
        renderCart(cart);
      } else {
        var est = estimateSubtotal(cart);
        if (!cart.cost) cart.cost = {};
        cart.cost.subtotalAmount = {
          amount: String(est.amount),
          currencyCode: est.currencyCode,
        };
        updateFooterFromCart(cart);
      }
      return;
    }

    node.quantity = quantity;
    cart.totalQuantity = sumCartQuantity(cart);
    patchLineInDom(lineId, quantity, unit, currency);
    var estQty = estimateSubtotal(cart);
    if (!cart.cost) cart.cost = {};
    cart.cost.subtotalAmount = {
      amount: String(estQty.amount),
      currencyCode: estQty.currencyCode,
    };
    updateFooterFromCart(cart);
  }

  function queueLineSync(lineId, quantity) {
    lineSyncQty[lineId] = quantity;
    if (lineSyncTimers[lineId]) {
      clearTimeout(lineSyncTimers[lineId]);
    }
    lineSyncTimers[lineId] = setTimeout(function () {
      lineSyncTimers[lineId] = null;
      var targetQty = lineSyncQty[lineId];
      delete lineSyncQty[lineId];
      var gen = (lineSyncGen[lineId] || 0) + 1;
      lineSyncGen[lineId] = gen;

      updateLine(lineId, targetQty, true)
        .then(function () {
          if (lineSyncGen[lineId] !== gen) return;
          if (lineSyncQty[lineId] !== undefined) return;
        })
        .catch(function () {
          if (lineSyncGen[lineId] !== gen) return;
          var id = getCartId();
          if (!id) return;
          fetchCart(id).then(function (fresh) {
            if (fresh) renderCart(fresh);
          });
        });
    }, LINE_SYNC_MS);
  }

  function setLineQuantity(lineId, quantity) {
    optimisticApplyQuantity(lineId, quantity);
    queueLineSync(lineId, quantity);
  }

  function onCartBodyClick(e) {
    var qtyBtn = e.target.closest("[data-qty-delta]");
    if (qtyBtn) {
      var row = qtyBtn.closest(".vivaci-cart-line");
      if (!row) return;
      var lineId = row.getAttribute("data-line-id");
      var delta = parseInt(qtyBtn.getAttribute("data-qty-delta"), 10);
      var span = row.querySelector(".vivaci-cart-qty span");
      if (!span || !lineId) return;
      var next = Math.max(0, parseInt(span.textContent, 10) + delta);
      setLineQuantity(lineId, next);
      return;
    }
    var removeBtn = e.target.closest("[data-line-remove]");
    if (removeBtn) {
      var lineRow = removeBtn.closest(".vivaci-cart-line");
      if (!lineRow) return;
      setLineQuantity(lineRow.getAttribute("data-line-id"), 0);
    }
  }

  window.VivaciShopifyCart = {
    init: initCart,
    addVariant: addVariant,
    updateLine: updateLine,
    removeLine: removeLine,
    getCart: function () { return cartState.cart; },
    formatMoney: formatMoney,
    openDrawer: function () { emit("vivaci:cart-open"); },
    checkout: function () {
      var cart = cartState.cart;
      if (cart && cart.checkoutUrl) {
        window.location.href = cart.checkoutUrl;
      }
    },
    syncNavCount: syncNavCount,
  };

  function cartPaymentsHtml() {
    return (
      '<div class="vivaci-cart-payments">' +
      '<ul class="vivaci-cart-payments__list" aria-label="' +
      ui("cart.payments", "Betalningsalternativ") +
      '">' +
    '<li><img src="/images/payments/visa.svg" alt="Visa" class="vivaci-cart-payments__logo" width="38" height="24" loading="lazy" decoding="async"></li>' +
    '<li><img src="/images/payments/mastercard.svg" alt="Mastercard" class="vivaci-cart-payments__logo" width="38" height="24" loading="lazy" decoding="async"></li>' +
    '<li><img src="/images/payments/swish.svg" alt="Swish" class="vivaci-cart-payments__logo" width="38" height="24" loading="lazy" decoding="async"></li>' +
      '<li><img src="/images/payments/klarna.svg" alt="Klarna" class="vivaci-cart-payments__logo" width="38" height="24" loading="lazy" decoding="async"></li>' +
      "</ul></div>"
    );
  }

  function applyCartI18n() {
    var root = document.getElementById("vivaci-cart-root");
    if (!root) return;
    var title = root.querySelector("#vivaci-cart-title");
    if (title) title.textContent = ui("cart.title", "Varukorg");
    root.querySelectorAll("[data-vivaci-cart-close]").forEach(function (btn) {
      btn.setAttribute("aria-label", ui("nav.close", "Stäng"));
    });
    var note = root.querySelector(".vivaci-cart-shipping-note");
    if (note) note.textContent = ui("cart.shippingNote", "Frakt beräknas i kassan.");
    var subLabel = root.querySelector(".vivaci-cart-subtotal > span:first-child");
    if (subLabel) subLabel.textContent = ui("cart.subtotal", "Delsumma");
    var checkout = root.querySelector("[data-vivaci-cart-checkout]");
    if (checkout) checkout.textContent = ui("cart.checkout", "Gå till kassan");
    root.querySelectorAll(".vivaci-cart-footer__actions [data-vivaci-cart-close]").forEach(function (btn) {
      btn.textContent = ui("cart.continueShopping", "Fortsätt handla");
    });
    var payList = root.querySelector(".vivaci-cart-payments__list");
    if (payList) payList.setAttribute("aria-label", ui("cart.payments", "Betalningsalternativ"));
    var empty = root.querySelector(".vivaci-cart-empty");
    if (empty) empty.textContent = ui("cart.empty", "Varukorgen är tom.");
    root.querySelectorAll("[data-qty-delta=\"-1\"]").forEach(function (btn) {
      btn.setAttribute("aria-label", ui("cart.decrease", "Minska"));
    });
    root.querySelectorAll("[data-qty-delta=\"1\"]").forEach(function (btn) {
      btn.setAttribute("aria-label", ui("cart.increase", "Öka"));
    });
  }

  function wireCartBodyDelegation() {
    var bodyEl = document.querySelector("[data-vivaci-cart-body]");
    if (!bodyEl || bodyEl.getAttribute("data-vivaci-cart-delegation") === "1") return;
    bodyEl.setAttribute("data-vivaci-cart-delegation", "1");
    bodyEl.addEventListener("click", onCartBodyClick);
  }

  /* —— Drawer UI —— */
  function mountDrawer() {
    if (document.getElementById("vivaci-cart-root")) {
      wireCartBodyDelegation();
      return;
    }

    var root = document.createElement("div");
    root.id = "vivaci-cart-root";
    root.className = "vivaci-cart-root";
    root.innerHTML =
      '<div class="vivaci-cart-overlay" data-vivaci-cart-close tabindex="-1" aria-hidden="true"></div>' +
      '<aside class="vivaci-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="vivaci-cart-title">' +
      '<div class="vivaci-cart-header">' +
      '<h2 id="vivaci-cart-title">' +
      ui("cart.title", "Varukorg") +
      "</h2>" +
      '<button type="button" class="vivaci-cart-close" data-vivaci-cart-close aria-label="' +
      ui("nav.close", "Stäng") +
      '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" aria-hidden="true" role="img"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      "</button></div>" +
      '<div class="vivaci-cart-body" data-vivaci-cart-body></div>' +
      '<div class="vivaci-cart-footer">' +
      '<p class="vivaci-cart-shipping-note text-size-small text-style-muted">' +
      ui("cart.shippingNote", "Frakt beräknas i kassan.") +
      "</p>" +
      '<div class="vivaci-cart-subtotal"><span>' +
      ui("cart.subtotal", "Delsumma") +
      '</span><span data-vivaci-cart-subtotal>—</span></div>' +
      cartPaymentsHtml() +
      '<div class="vivaci-cart-footer__actions">' +
      '<button type="button" class="button w-button" data-vivaci-cart-checkout>' +
      ui("cart.checkout", "Gå till kassan") +
      "</button>" +
      '<button type="button" class="button is-secondary w-button" data-vivaci-cart-close>' +
      ui("cart.continueShopping", "Fortsätt handla") +
      "</button>" +
      "</div>" +
      "</div></aside>";
    document.body.appendChild(root);

    root.querySelectorAll("[data-vivaci-cart-close]").forEach(function (el) {
      el.addEventListener("click", closeDrawer);
    });
    root.querySelector("[data-vivaci-cart-checkout]").addEventListener("click", function () {
      window.VivaciShopifyCart.checkout();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    wireCartBodyDelegation();
    applyCartI18n();
  }

  function openDrawer() {
    mountDrawer();
    document.getElementById("vivaci-cart-root").classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    var root = document.getElementById("vivaci-cart-root");
    if (root) root.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  window.addEventListener("vivaci:cart-open", openDrawer);

  function renderCart(cart) {
    mountDrawer();
    var body = document.querySelector("[data-vivaci-cart-body]");
    var sub = document.querySelector("[data-vivaci-cart-subtotal]");
    if (!body) return;

    if (!cart || !cart.totalQuantity) {
      body.innerHTML =
        '<p class="vivaci-cart-empty">' + ui("cart.empty", "Varukorgen är tom.") + "</p>";
      if (sub) sub.textContent = formatMoney(0, "SEK");
      updateTrigger(0);
      return;
    }

    var lines = (cart.lines && cart.lines.edges) || [];
    body.innerHTML = lines
      .map(function (edge) {
        var line = edge.node;
        var m = line.merchandise;
        var img = (m.image && m.image.url) || "";
        var title = (m.product && m.product.title) || m.title || "";
        var variant = m.title && m.title !== "Default Title" ? m.title : "";
        var price = m.price || {};
        return (
          '<div class="vivaci-cart-line" data-line-id="' +
          line.id +
          '">' +
          (img ? '<img class="vivaci-cart-line__img" src="' + img + '" alt="">' : '<div class="vivaci-cart-line__img vivaci-cart-line__img--empty"></div>') +
          '<div class="vivaci-cart-line__body">' +
          '<div class="vivaci-cart-line__head">' +
          '<p class="vivaci-cart-line__title">' +
          title +
          "</p>" +
          '<p class="vivaci-cart-line__price">' +
          formatMoney(parseFloat(price.amount) * line.quantity, price.currencyCode) +
          "</p></div>" +
          (variant ? '<p class="vivaci-cart-line__meta">' + variant + "</p>" : "") +
          '<div class="vivaci-cart-line__foot">' +
          '<div class="vivaci-cart-qty">' +
          '<button type="button" data-qty-delta="-1" aria-label="' +
          ui("cart.decrease", "Minska") +
          '">−</button>' +
          "<span>" +
          line.quantity +
          "</span>" +
          '<button type="button" data-qty-delta="1" aria-label="' +
          ui("cart.increase", "Öka") +
          '">+</button>' +
          "</div>" +
          '<button type="button" class="vivaci-cart-line__remove" data-line-remove>' +
          ui("cart.remove", "Ta bort") +
          "</button>" +
          "</div></div></div>"
        );
      })
      .join("");

    updateFooterFromCart(cart);
    applyCartI18n();
  }

  function updateTrigger(count) {
    var qty = count > 0 ? count : 0;
    try {
      localStorage.setItem(CART_QTY_KEY, String(qty));
    } catch (e) {}
    document.querySelectorAll("[data-vivaci-cart-count]").forEach(function (el) {
      el.textContent = qty > 0 ? String(qty) : "";
      el.setAttribute("data-count", String(qty));
    });
  }

  function syncNavCount() {
    var qty = 0;
    if (cartState.cart && cartState.cart.totalQuantity) {
      qty = cartState.cart.totalQuantity;
    } else {
      try {
        var raw = localStorage.getItem(CART_QTY_KEY);
        qty = parseInt(raw || "0", 10);
        if (!isFinite(qty) || qty < 0) qty = 0;
      } catch (e) {
        qty = 0;
      }
    }
    updateTrigger(qty);
    return qty;
  }

  function wireCartTriggers() {
    document.querySelectorAll("[data-vivaci-cart-trigger]").forEach(function (btn) {
      if (btn.getAttribute("data-vivaci-cart-wired") === "true") return;
      btn.setAttribute("data-vivaci-cart-wired", "true");
      btn.addEventListener("click", openDrawer);
    });
  }

  function mountNavTrigger() {
    wireCartTriggers();
  }

  function bootCartShell() {
    mountNavTrigger();
    syncNavCount();
    if (window.VivaciShopify) {
      window.VivaciShopifyCart.init().finally(function () {
        emitCartHydrated();
      });
    } else {
      emitCartHydrated();
    }
  }

  window.addEventListener("vivaci:cart-updated", function (e) {
    renderCart(e.detail && e.detail.cart);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootCartShell);
  } else {
    bootCartShell();
  }

  document.addEventListener("vivaci:nav-ready", function () {
    mountNavTrigger();
    syncNavCount();
  });
  document.addEventListener("vivaci:nav-actions-ready", function () {
    mountNavTrigger();
    syncNavCount();
  });
  document.addEventListener("vivaci:i18n-ready", applyCartI18n);
})();
