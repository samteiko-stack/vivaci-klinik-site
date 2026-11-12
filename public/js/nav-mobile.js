/**
 * Touch/tablet: click-to-toggle dropdowns (no hover) + reset GSAP inline styles.
 */
(function () {
  var MQ = "(max-width: 991px)";
  var mql = window.matchMedia(MQ);

  function clearGsapInline(root) {
    if (typeof gsap === "undefined" || !root) return;
    var sel =
      ".navbar7_dropdown-list, .navbar14_dropdown-list, .navbar12_dropdown-link, .navbar14_dropdown-link";
    root.querySelectorAll(sel).forEach(function (el) {
      gsap.set(el, { clearProps: "opacity,transform,filter,transformOrigin" });
    });
  }

  function bindMobileDropdownToggle() {
    var nav = document.querySelector(".navbar2_component");
    if (!nav || nav.getAttribute("data-vivaci-mobile-dropdown-click") === "1") {
      return;
    }
    nav.setAttribute("data-vivaci-mobile-dropdown-click", "1");
    nav.addEventListener(
      "click",
      function (e) {
        if (!mql.matches) return;
        if (!e.target.closest(".w-dropdown-toggle")) return;
        window.requestAnimationFrame(function () {
          clearGsapInline(nav);
        });
      },
      true
    );
  }

  function syncDropdownMode() {
    var nav = document.querySelector(".navbar2_component");
    document.querySelectorAll(".navbar2_component .w-dropdown").forEach(function (drop) {
      if (mql.matches) {
        drop.setAttribute("data-hover", "false");
        drop.setAttribute("data-delay", "0");
      } else {
        /* Desktop hover: vivaci-nav-dropdown-fix.js (Webflow data-hover off). */
        drop.setAttribute("data-hover", "false");
        if (drop.classList.contains("navbar14_menu-dropdown")) {
          drop.setAttribute("data-delay", "200");
        } else {
          drop.setAttribute("data-delay", "300");
        }
      }
    });
    if (mql.matches && nav) {
      clearGsapInline(nav);
      bindMobileDropdownToggle();
    }
  }

  function onNavReady() {
    syncDropdownMode();
  }

  syncDropdownMode();
  bindMobileDropdownToggle();
  if (mql.addEventListener) mql.addEventListener("change", syncDropdownMode);
  else if (mql.addListener) mql.addListener(syncDropdownMode);

  document.addEventListener("vivaci:nav-ready", onNavReady);
  document.addEventListener("vivaci:nav-viewport-changed", function () {
    var nav = document.querySelector(".navbar2_component");
    if (nav) clearGsapInline(nav);
    syncDropdownMode();
  });
  document.addEventListener("DOMContentLoaded", syncDropdownMode);
})();
