/**
 * Desktop-only nav mega-menu open/close (w--open). Mobile uses Webflow + nav-mobile.js.
 */
(function () {
  if (window.__vivaciNavDropdownFixLoaded) return;
  window.__vivaciNavDropdownFixLoaded = true;

  var ROOT = ".navbar2_component";
  var DESKTOP = "(min-width: 992px)";
  var mql = window.matchMedia(DESKTOP);
  var closeTimers = new WeakMap();
  var boundDesktop = false;
  var CLOSE_MS = 450;

  function dropdowns() {
    return document.querySelectorAll(ROOT + " .w-dropdown");
  }

  function dropdownList(drop) {
    return drop.querySelector(".w-dropdown-list");
  }

  function isPointerOverDrop(drop) {
    if (!drop) return false;
    if (drop.matches(":hover")) return true;
    var list = dropdownList(drop);
    return !!(list && list.matches(":hover"));
  }

  function openDropdown(drop) {
    var list = drop.querySelector(".w-dropdown-list");
    var toggle = drop.querySelector(".w-dropdown-toggle");
    if (list) list.classList.add("w--open");
    if (toggle) toggle.classList.add("w--open");
    drop.classList.add("w--open");
  }

  function closeDropdown(drop, immediate) {
    var list = dropdownList(drop);
    var toggle = drop.querySelector(".w-dropdown-toggle");
    var attrDelay = parseInt(drop.getAttribute("data-delay") || "0", 10);
    var delay = immediate ? 0 : Math.max(CLOSE_MS, attrDelay || 0);
    if (closeTimers.has(drop)) clearTimeout(closeTimers.get(drop));
    closeTimers.set(
      drop,
      setTimeout(function () {
        if (isPointerOverDrop(drop)) return;
        if (list) list.classList.remove("w--open");
        if (toggle) toggle.classList.remove("w--open");
        drop.classList.remove("w--open");
      }, delay)
    );
  }

  function closeAllExcept(keep) {
    dropdowns().forEach(function (drop) {
      if (drop !== keep) closeDropdown(drop, true);
    });
  }

  function onEnter(drop) {
    if (!mql.matches) return;
    if (closeTimers.has(drop)) clearTimeout(closeTimers.get(drop));
    closeAllExcept(drop);
    openDropdown(drop);
  }

  function onLeave(drop) {
    if (!mql.matches) return;
    closeDropdown(drop, false);
  }

  function bindHoverTarget(el, drop) {
    if (!el || el.getAttribute("data-vivaci-dropdown-hover") === "true") return;
    el.setAttribute("data-vivaci-dropdown-hover", "true");
    el.addEventListener("mouseenter", function () {
      onEnter(drop);
    });
    el.addEventListener("mouseleave", function () {
      onLeave(drop);
    });
  }

  function bindDesktop() {
    if (boundDesktop || !mql.matches) return;
    dropdowns().forEach(function (drop) {
      if (drop.getAttribute("data-vivaci-dropdown-desktop") === "true") return;
      drop.setAttribute("data-vivaci-dropdown-desktop", "true");
      /* Webflow hover fights mega-menu travel; we own open/close on desktop. */
      drop.setAttribute("data-hover", "false");
      bindHoverTarget(drop, drop);
      bindHoverTarget(dropdownList(drop), drop);
    });
    boundDesktop = true;
  }

  function init() {
    if (!mql.matches) return;
    bindDesktop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("vivaci:nav-ready", init);
  if (mql.addEventListener) {
    mql.addEventListener("change", function () {
      if (mql.matches) init();
    });
  }
})();
