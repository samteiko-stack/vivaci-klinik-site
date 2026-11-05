/**
 * Nav utilities: search + varukorg (visible next to menu button).
 */
(function () {
  if (!document.querySelector('script[src*="vivaci-i18n"]')) {
    var i18nBoot = document.createElement("script");
    i18nBoot.src = "/js/vivaci-i18n.js";
    i18nBoot.defer = true;
    document.head.appendChild(i18nBoot);
  }

  if (window.__vivaciNavActionsLoaded) return;
  window.__vivaciNavActionsLoaded = true;

  var NAV_URL = "/content/from-production/nav.json";

  function ui(key, fallback) {
    if (window.VivaciI18n && window.VivaciI18n.t) {
      return window.VivaciI18n.t(key, null, fallback);
    }
    return fallback;
  }
  var LOCALE_KEY = "vivaci-locale";
  var LOCALES = [
    { id: "sv", label: "Svenska", short: "SV" },
    { id: "en", label: "English", short: "EN" },
  ];
  var CART_QTY_KEY = "vivaci_cart_last_qty";

  function readCachedCartQty() {
    try {
      var raw = localStorage.getItem(CART_QTY_KEY);
      var n = parseInt(raw || "0", 10);
      return n > 0 && isFinite(n) ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function markShellNavReady() {
    document.documentElement.classList.add("vivaci-nav-ready");
    document.dispatchEvent(new CustomEvent("vivaci:nav-actions-ready"));
    if (!document.querySelector('script[src*="vivaci-shopify-cart"]')) {
      window.__vivaciCartHydrated = true;
      document.dispatchEvent(new CustomEvent("vivaci:cart-hydrated"));
    }
  }

  var SEARCH_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
  var CART_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';
  var GLOBE_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';

  var HAMBURGER_LINES =
    '<div class="menu-icon2_line-top"></div>' +
    '<div class="menu-icon2_line-middle"><div class="menu-icon1_line-middle-inner"></div></div>' +
    '<div class="menu-icon2_line-bottom"></div>';

  /** Restore classic three-line icon if an older build swapped in dots. */
  function ensureHamburgerIcon() {
    document.querySelectorAll(".navbar14_menu-button .menu-icon2").forEach(function (shell) {
      if (shell.querySelector(".menu-icon2_line-top")) return;
      shell.classList.remove("is-vivaci-menu-dots");
      shell.removeAttribute("data-vivaci-menu-dots");
      shell.innerHTML = HAMBURGER_LINES;
    });
  }

  var searchIndex = [];
  var searchClosing = false;

  function motion() {
    return window.VivaciMotion || {};
  }

  function motionEnabled() {
    return motion().gsapReady && motion().gsapReady();
  }

  function dur(key) {
    var d = motion().duration;
    return (d && d[key]) || 0.32;
  }

  function dist(key) {
    var n = key === "md" ? 20 : 12;
    var d = motion().distance;
    if (d && d[key] != null) n = d[key];
    return n;
  }

  function ease(key) {
    var e = motion().ease;
    return (e && e[key]) || "power2.out";
  }

  function animateSearchIn(overlay, panel) {
    if (!motionEnabled()) {
      if (overlay) overlay.style.opacity = "1";
      if (panel) {
        panel.style.opacity = "1";
        panel.style.transform = "none";
      }
      return;
    }
    gsap.killTweensOf([overlay, panel]);
    gsap.set(overlay, { opacity: 0 });
    gsap.set(panel, {
      opacity: 0,
      y: dist("md"),
      scale: 0.98,
      transformOrigin: "50% 50%",
    });
    gsap.to(overlay, { opacity: 1, duration: dur("modalIn"), ease: ease("out") });
    gsap.to(panel, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: dur("modalIn"),
      ease: ease("emphasis"),
      clearProps: "transform",
    });
  }

  function animateSearchOut(overlay, panel, done) {
    if (!motionEnabled()) {
      done();
      return;
    }
    gsap.killTweensOf([overlay, panel]);
    gsap.to(panel, {
      opacity: 0,
      y: dist("sm"),
      scale: 0.99,
      duration: dur("modalOut"),
      ease: ease("in"),
    });
    gsap.to(overlay, {
      opacity: 0,
      duration: dur("modalOut"),
      ease: ease("in"),
      onComplete: done,
    });
  }

  function flattenNavItems(data) {
    var out = [];
    (data.categories || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        if (item.href && item.label) out.push(item);
      });
    });
    return out;
  }

  function mountSearchOverlay() {
    if (document.getElementById("vivaci-nav-search")) return;
    var root = document.createElement("div");
    root.id = "vivaci-nav-search";
    root.className = "vivaci-nav-search";
    root.innerHTML =
      '<div class="vivaci-nav-search__backdrop" data-vivaci-nav-search-close tabindex="-1" aria-hidden="true"></div>' +
      '<div class="vivaci-nav-search__dialog">' +
      '<div class="vivaci-nav-search__panel" role="dialog" aria-modal="true" aria-labelledby="vivaci-nav-search-title">' +
      '<div class="vivaci-nav-search__header">' +
      '<h2 id="vivaci-nav-search-title" class="heading-style-h6">' +
      ui("nav.searchTitle", "Sök") +
      "</h2>" +
      '<button type="button" class="vivaci-nav-search__close" data-vivaci-nav-search-close aria-label="' +
      ui("nav.close", "Stäng") +
      '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" aria-hidden="true" role="img"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      "</button></div>" +
      '<div class="filters5_keyword-search vivaci-nav-search__field">' +
      '<input class="form_input is-icon-left w-input" type="search" autocomplete="off" placeholder="' +
      ui("nav.searchPlaceholder", "Sök behandling eller sidor") +
      '" data-vivaci-nav-search-input>' +
      '<div class="form_icon-wrapper"><div class="icon-embed-xsmall w-embed">' +
      SEARCH_ICON +
      "</div></div></div>" +
      '<ul class="vivaci-nav-search__results" data-vivaci-nav-search-results></ul>' +
      "</div></div>";
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);

    root.querySelectorAll("[data-vivaci-nav-search-close]").forEach(function (el) {
      el.addEventListener("click", closeSearch);
    });
    var input = root.querySelector("[data-vivaci-nav-search-input]");
    var debounce;
    input.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        renderSearchResults(input.value.trim());
      }, 160);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSearch();
    });
  }

  function openSearch() {
    if (searchClosing) return;
    mountSearchOverlay();
    var root = document.getElementById("vivaci-nav-search");
    if (!root || root.classList.contains("is-open")) return;

    var overlay = root.querySelector(".vivaci-nav-search__backdrop");
    var panel = root.querySelector(".vivaci-nav-search__panel");

    root.setAttribute("aria-hidden", "false");
    root.classList.add("is-open");
    document.documentElement.classList.add("vivaci-nav-search-open");
    document.body.style.overflow = "hidden";

    animateSearchIn(overlay, panel);

    var input = root.querySelector("[data-vivaci-nav-search-input]");
    if (input) {
      input.value = "";
      renderSearchResults("");
      setTimeout(function () {
        input.focus();
      }, motionEnabled() ? dur("modalIn") * 1000 * 0.5 : 50);
    }
  }

  function closeSearch() {
    var root = document.getElementById("vivaci-nav-search");
    if (!root || !root.classList.contains("is-open") || searchClosing) return;

    searchClosing = true;
    var overlay = root.querySelector(".vivaci-nav-search__backdrop");
    var panel = root.querySelector(".vivaci-nav-search__panel");

    animateSearchOut(overlay, panel, function () {
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("vivaci-nav-search-open");
      document.body.style.overflow = "";
      searchClosing = false;
    });
  }

  function renderSearchResults(query) {
    var list = document.querySelector("[data-vivaci-nav-search-results]");
    if (!list) return;
    var q = query.toLowerCase();
    var items = searchIndex.filter(function (item) {
      if (!q) return true;
      return (
        (item.label && item.label.toLowerCase().indexOf(q) !== -1) ||
        (item.description && item.description.toLowerCase().indexOf(q) !== -1)
      );
    });
    if (!items.length) {
      list.innerHTML =
        '<li class="vivaci-nav-search__empty text-size-small text-style-muted">' +
        ui("nav.searchEmpty", "Inga träffar.") +
        "</li>";
      return;
    }
    list.innerHTML = items
      .slice(0, 12)
      .map(function (item) {
        return (
          '<li><a class="vivaci-nav-search__hit" href="' +
          item.href +
          '"><span class="text-weight-semibold">' +
          item.label +
          "</span>" +
          (item.description
            ? '<span class="text-size-small text-style-muted">' +
              item.description +
              "</span>"
            : "") +
          "</a></li>"
        );
      })
      .join("");
  }

  function normalizeLocale(raw) {
    var id = String(raw || "sv").toLowerCase().slice(0, 2);
    return LOCALES.some(function (l) {
      return l.id === id;
    })
      ? id
      : "sv";
  }

  function readStoredLocale() {
    try {
      var stored = localStorage.getItem(LOCALE_KEY);
      if (stored) return normalizeLocale(stored);
    } catch (_) {}
    if (window.VivaciI18n && window.VivaciI18n.getLocale) {
      return normalizeLocale(window.VivaciI18n.getLocale());
    }
    return "sv";
  }

  function applyLocale(localeId) {
    var locale = normalizeLocale(localeId);
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch (_) {}
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("data-vivaci-locale", locale);
    document.dispatchEvent(
      new CustomEvent("vivaci:locale-change", { detail: { locale: locale } })
    );
    return locale;
  }

  function localeMeta(id) {
    return (
      LOCALES.find(function (l) {
        return l.id === id;
      }) || LOCALES[0]
    );
  }

  function langSwitcherHtml() {
    var current = readStoredLocale();
    var options = LOCALES.map(function (l) {
      var selected = l.id === current ? ' aria-selected="true"' : "";
      return (
        '<li role="presentation">' +
        '<button type="button" class="vivaci-nav-lang-option" role="option" data-vivaci-nav-lang-option="' +
        l.id +
        '"' +
        selected +
        ">" +
        l.label +
        "</button></li>"
      );
    }).join("");
    return (
      '<div class="vivaci-nav-lang" data-vivaci-nav-lang>' +
      '<button type="button" class="vivaci-nav-lang-trigger" data-vivaci-nav-lang-trigger aria-haspopup="listbox" aria-expanded="false" aria-label="' +
      ui("nav.language", "Språk") +
      '">' +
      '<span class="vivaci-nav-lang-trigger__icon icon-embed-xxsmall w-embed" aria-hidden="true">' +
      GLOBE_ICON +
      "</span>" +
      '<span class="vivaci-nav-lang-trigger__code" data-vivaci-nav-lang-current>' +
      localeMeta(current).label +
      "</span></button>" +
      '<ul class="vivaci-nav-lang-menu" data-vivaci-nav-lang-menu role="listbox" tabindex="-1" hidden>' +
      options +
      "</ul></div>"
    );
  }

  function syncLangSwitcherUI(root, localeId) {
    if (!root) return;
    var meta = localeMeta(localeId);
    var current = root.querySelector("[data-vivaci-nav-lang-current]");
    if (current) current.textContent = meta.label;
    root.querySelectorAll("[data-vivaci-nav-lang-option]").forEach(function (btn) {
      var on = btn.getAttribute("data-vivaci-nav-lang-option") === localeId;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });
  }

  function closeLangMenu(root) {
    if (!root) return;
    var trigger = root.querySelector("[data-vivaci-nav-lang-trigger]");
    var menu = root.querySelector("[data-vivaci-nav-lang-menu]");
    root.classList.remove("is-open");
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  function openLangMenu(root) {
    var trigger = root.querySelector("[data-vivaci-nav-lang-trigger]");
    var menu = root.querySelector("[data-vivaci-nav-lang-menu]");
    root.classList.add("is-open");
    if (menu) menu.hidden = false;
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  function mountLangSwitcher(wrapper) {
    var root = wrapper.querySelector("[data-vivaci-nav-lang]");
    if (!root || root.getAttribute("data-vivaci-nav-lang-bound") === "true") return;
    root.setAttribute("data-vivaci-nav-lang-bound", "true");

    var locale = applyLocale(readStoredLocale());
    syncLangSwitcherUI(root, locale);

    var trigger = root.querySelector("[data-vivaci-nav-lang-trigger]");
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (root.classList.contains("is-open")) closeLangMenu(root);
      else openLangMenu(root);
    });

    root.querySelectorAll("[data-vivaci-nav-lang-option]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = applyLocale(btn.getAttribute("data-vivaci-nav-lang-option"));
        syncLangSwitcherUI(root, next);
        closeLangMenu(root);
      });
    });

    document.addEventListener("click", function (e) {
      if (!root.classList.contains("is-open")) return;
      if (root.contains(e.target)) return;
      closeLangMenu(root);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLangMenu(root);
    });
  }

  function mountActions(wrapper) {
    if (wrapper.getAttribute("data-vivaci-nav-actions-mounted") === "true") {
      markShellNavReady();
      return;
    }
    wrapper.setAttribute("data-vivaci-nav-actions-mounted", "true");
    wrapper.classList.add("vivaci-nav-actions");
    wrapper.removeAttribute("aria-hidden");
    wrapper.style.display = "";

    var cartQty = readCachedCartQty();
    var cartCountAttrs =
      ' data-vivaci-cart-count data-count="' +
      cartQty +
      '">' +
      (cartQty > 0 ? String(cartQty) : "");

    wrapper.innerHTML =
      '<div class="vivaci-nav-actions__cluster">' +
      langSwitcherHtml() +
      '<span class="vivaci-nav-actions__divider" aria-hidden="true"></span>' +
      '<button type="button" class="vivaci-nav-search-trigger" data-vivaci-nav-search-open aria-label="' +
      ui("nav.search", "Sök") +
      '">' +
      SEARCH_ICON +
      "</button>" +
      '<span class="vivaci-nav-actions__divider" aria-hidden="true"></span>' +
      '<button type="button" class="vivaci-cart-nav-btn" data-vivaci-cart-trigger aria-label="' +
      ui("nav.cart", "Varukorg") +
      '">' +
      CART_ICON +
      '<span class="vivaci-cart-nav-btn__label">' +
      ui("nav.cart", "Varukorg") +
      "</span>" +
      '<span class="vivaci-cart-trigger__count"' +
      cartCountAttrs +
      "</span>" +
      "</button></div>";

    mountLangSwitcher(wrapper);
    wrapper.querySelector("[data-vivaci-nav-search-open]").addEventListener("click", openSearch);
    markShellNavReady();
  }

  function headerActionsSlot(container) {
    var menuBtn = container.querySelector(".w-nav-button");
    var slot = container.querySelector("[data-vivaci-nav-actions-slot]");

    if (!slot) {
      slot = document.createElement("div");
      slot.className = "vivaci-nav-actions-slot";
      slot.setAttribute("data-vivaci-nav-actions-slot", "");
      slot.setAttribute("data-vivaci-nav-actions", "");
    }

    if (!slot.hasAttribute("data-vivaci-nav-actions")) {
      slot.setAttribute("data-vivaci-nav-actions", "");
    }

    /* Resize used to park the slot inside the drawer — always anchor before hamburger. */
    if (menuBtn) {
      if (slot.parentElement !== container || slot.nextElementSibling !== menuBtn) {
        container.insertBefore(slot, menuBtn);
      }
    } else if (slot.parentElement !== container) {
      container.appendChild(slot);
    }

    return slot;
  }

  function getMountPoint() {
    var container = document.querySelector(".navbar14_container");
    if (!container) return null;
    return headerActionsSlot(container);
  }

  function hideDrawerNavPlaceholders(activeMount) {
    document
      .querySelectorAll(".navbar14_menu [data-vivaci-nav-actions]")
      .forEach(function (el) {
        if (activeMount && (el === activeMount || el.contains(activeMount))) return;
        el.style.display = "none";
        el.setAttribute("aria-hidden", "true");
      });
  }

  function relayoutNavActions() {
    var container = document.querySelector(".navbar14_container");
    if (!container) return;

    var target = getMountPoint();
    if (!target) return;

    var mounted = document.querySelector(
      "[data-vivaci-nav-actions-mounted='true']"
    );
    var cluster = target.querySelector(".vivaci-nav-actions__cluster");

    if (!cluster && mounted && mounted !== target) {
      cluster = mounted.querySelector(".vivaci-nav-actions__cluster");
      if (cluster) {
        target.appendChild(cluster);
      }
      mounted.removeAttribute("data-vivaci-nav-actions-mounted");
      mounted.classList.remove("vivaci-nav-actions");
      if (mounted.closest(".navbar14_menu")) {
        mounted.style.display = "none";
        mounted.setAttribute("aria-hidden", "true");
      }
    }

    target.classList.add("vivaci-nav-actions");
    target.style.display = "";
    target.removeAttribute("aria-hidden");
    hideDrawerNavPlaceholders(target);

    cluster = target.querySelector(".vivaci-nav-actions__cluster");
    if (cluster) {
      target.setAttribute("data-vivaci-nav-actions-mounted", "true");
      markShellNavReady();
      return;
    }

    mountActions(target);
  }

  function initNavActions() {
    relayoutNavActions();
  }

  function fetchNavJson() {
    if (window.VivaciI18n && window.VivaciI18n.fetchContent) {
      return window.VivaciI18n.fetchContent(NAV_URL);
    }
    return fetch(NAV_URL).then(function (r) {
      if (!r.ok) throw new Error("nav.json");
      return r.json();
    });
  }

  function applyNavActionsI18n() {
    var searchRoot = document.getElementById("vivaci-nav-search");
    if (searchRoot) {
      var title = searchRoot.querySelector("#vivaci-nav-search-title");
      if (title) title.textContent = ui("nav.searchTitle", "Sök");
      searchRoot.querySelectorAll("[data-vivaci-nav-search-close]").forEach(function (btn) {
        btn.setAttribute("aria-label", ui("nav.close", "Stäng"));
      });
      var input = searchRoot.querySelector("[data-vivaci-nav-search-input]");
      if (input) input.placeholder = ui("nav.searchPlaceholder", "Sök behandling eller sidor");
    }
    document.querySelectorAll("[data-vivaci-nav-search-open]").forEach(function (btn) {
      btn.setAttribute("aria-label", ui("nav.search", "Sök"));
    });
    document.querySelectorAll("[data-vivaci-cart-nav-btn]").forEach(function (btn) {
      btn.setAttribute("aria-label", ui("nav.cart", "Varukorg"));
    });
    document.querySelectorAll(".vivaci-cart-nav-btn__label").forEach(function (el) {
      el.textContent = ui("nav.cart", "Varukorg");
    });
    document.querySelectorAll("[data-vivaci-nav-lang-trigger]").forEach(function (btn) {
      btn.setAttribute("aria-label", ui("nav.language", "Språk"));
    });
  }

  function loadSearchIndex() {
    return fetchNavJson()
      .then(function (data) {
        searchIndex = flattenNavItems(data);
      })
      .catch(function () {
        searchIndex = [];
      });
  }

  function bootNavActions() {
    ensureHamburgerIcon();
    initNavActions();
    loadSearchIndex();
  }

  function whenI18n(cb) {
    if (window.VivaciI18n && window.VivaciI18n.whenReady) {
      window.VivaciI18n.whenReady().then(cb);
      return;
    }
    if (window.__vivaciI18nReady && window.__vivaciI18nReady.then) {
      window.__vivaciI18nReady.then(cb);
      return;
    }
    document.addEventListener("vivaci:i18n-ready", cb, { once: true });
    window.setTimeout(cb, 400);
  }

  function scheduleBoot() {
    var start = function () {
      whenI18n(bootNavActions);
    };
    if (document.querySelector(".navbar14_container")) {
      start();
      return;
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }

  scheduleBoot();

  document.addEventListener("vivaci:i18n-ready", function () {
    applyNavActionsI18n();
    loadSearchIndex();
  });

  var navMq = window.matchMedia("(max-width: 991px)");
  var relayoutScheduled = false;
  function scheduleRelayoutNavActions() {
    if (relayoutScheduled) return;
    relayoutScheduled = true;
    window.requestAnimationFrame(function () {
      relayoutScheduled = false;
      relayoutNavActions();
      document.dispatchEvent(new CustomEvent("vivaci:nav-viewport-changed"));
    });
  }
  if (navMq.addEventListener) {
    navMq.addEventListener("change", scheduleRelayoutNavActions);
  } else if (navMq.addListener) {
    navMq.addListener(scheduleRelayoutNavActions);
  }
  window.addEventListener("resize", scheduleRelayoutNavActions);
})();
