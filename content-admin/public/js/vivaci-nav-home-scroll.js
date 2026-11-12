/**
 * Homepage: transparent nav over hero → solid white bar after scroll or mobile menu open.
 */
(function () {
  if (window.__vivaciNavHomeScrollInit) return;
  window.__vivaciNavHomeScrollInit = true;

  var hero = document.getElementById("vivaci-home-hero");
  if (!hero) return;

  var root = document.documentElement;
  root.setAttribute("data-vivaci-page", "home");

  var logo = document.querySelector(".navbar14_logo[data-vivaci-nav-logo]");
  var logoLight =
    (logo && logo.getAttribute("data-vivaci-logo-light")) ||
    "/images/logo-vivaci-white.webp";
  var logoDark =
    (logo && logo.getAttribute("data-vivaci-logo-dark")) ||
    "/images/logo-vivaci-dark.webp";

  var threshold = 48;
  var ticking = false;
  var navEl = document.querySelector(".navbar2_component.w-nav");
  var menuObserver = null;

  function navMenuOpen() {
    if (!navEl) return false;
    if (navEl.classList.contains("w--open")) return true;
    var btn = navEl.querySelector(".w-nav-button");
    if (btn && btn.classList.contains("w--open")) return true;
  if (
      document.querySelector(
        ".navbar14_menu.w-nav-menu[data-nav-menu-open]"
      )
    ) {
      return true;
    }
    var overlay = navEl.querySelector(".w-nav-overlay");
    if (!overlay) return false;
    var style = window.getComputedStyle(overlay);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function shouldUseSolidChrome() {
    var y = window.scrollY || root.scrollTop || 0;
    return y > threshold || navMenuOpen();
  }

  function syncNavChrome() {
    var solid = shouldUseSolidChrome();
    root.classList.toggle("vivaci-nav-scrolled", solid);
    if (logo) {
      logo.src = solid ? logoDark : logoLight;
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        syncNavChrome();
      });
    }
  }

  function bindMenuObserver() {
    if (!navEl || menuObserver) return;
    menuObserver = new MutationObserver(syncNavChrome);
    menuObserver.observe(navEl, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
    var btn = navEl.querySelector(".w-nav-button");
    if (btn) {
      menuObserver.observe(btn, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    document.addEventListener(
      "click",
      function (e) {
        if (e.target.closest(".w-nav-button")) {
          window.requestAnimationFrame(syncNavChrome);
        }
      },
      true
    );
  }

  syncNavChrome();
  bindMenuObserver();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("vivaci:nav-viewport-changed", syncNavChrome);
})();
