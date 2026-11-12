/**
 * Nav scroll: home hero chrome + relaxed (taller) bar at top / normal height on scroll down.
 */
(function () {
  if (window.__vivaciNavScrollInit) return;
  window.__vivaciNavScrollInit = true;

  var root = document.documentElement;
  var hero = document.getElementById("vivaci-home-hero");
  var navEl = document.querySelector(".navbar2_component.w-nav");
  if (!navEl) return;

  if (hero && !root.getAttribute("data-vivaci-page")) {
    root.setAttribute("data-vivaci-page", "home");
  }

  var logo = document.querySelector(".navbar14_logo[data-vivaci-nav-logo]");
  var logoLight =
    (logo && logo.getAttribute("data-vivaci-logo-light")) ||
    "/images/logo-vivaci-white.webp";
  var logoDark =
    (logo && logo.getAttribute("data-vivaci-logo-dark")) ||
    "/images/logo-vivaci-dark.webp";

  var solidThreshold = 48;
  var relaxedThreshold = 96;
  var directionDelta = 6;
  var lastY = window.scrollY || root.scrollTop || 0;
  var lastDirection = 0;
  var ticking = false;
  var menuObserver = null;
  var desktopMq = window.matchMedia("(min-width: 992px)");

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

  function syncHomeChrome(y) {
    if (!hero) return;
    var solid = y > solidThreshold || navMenuOpen();
    root.classList.toggle("vivaci-nav-scrolled", solid);
    if (logo) {
      logo.src = solid ? logoDark : logoLight;
    }
  }

  function syncRelaxed(y) {
    if (!desktopMq.matches || navMenuOpen()) {
      root.classList.remove("vivaci-nav-relaxed");
      return;
    }

    if (y <= 12) {
      root.classList.add("vivaci-nav-relaxed");
      return;
    }

    if (y > relaxedThreshold) {
      if (lastDirection > 0) {
        root.classList.remove("vivaci-nav-relaxed");
      } else if (lastDirection < 0) {
        root.classList.add("vivaci-nav-relaxed");
      }
    } else {
      root.classList.remove("vivaci-nav-relaxed");
    }
  }

  function update() {
    ticking = false;
    var y = window.scrollY || root.scrollTop || 0;
    var delta = y - lastY;
    if (Math.abs(delta) >= directionDelta) {
      lastDirection = delta > 0 ? 1 : -1;
    }
    syncHomeChrome(y);
    syncRelaxed(y);
    lastY = y;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function bindMenuObserver() {
    if (!hero || menuObserver) return;
    menuObserver = new MutationObserver(function () {
      requestAnimationFrame(update);
    });
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
          requestAnimationFrame(update);
        }
      },
      true
    );
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("vivaci-nav-reduced-motion");
  }

  update();
  bindMenuObserver();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("vivaci:nav-viewport-changed", onScroll);
  if (desktopMq.addEventListener) {
    desktopMq.addEventListener("change", onScroll);
  } else if (desktopMq.addListener) {
    desktopMq.addListener(onScroll);
  }
})();
