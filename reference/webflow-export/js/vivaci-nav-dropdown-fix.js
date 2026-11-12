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
  /** Gap after sync-close before next w--open (matches nav-dropdown panel out). */
  var SWITCH_OPEN_MS = 180;
  var pendingOpenTimer = null;
  var pendingOpenDrop = null;

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

  function applyClose(drop) {
    var list = dropdownList(drop);
    var toggle = drop.querySelector(".w-dropdown-toggle");
    if (list) list.classList.remove("w--open");
    if (toggle) toggle.classList.remove("w--open");
    drop.classList.remove("w--open");
  }

  function openDropdown(drop) {
    var list = drop.querySelector(".w-dropdown-list");
    var toggle = drop.querySelector(".w-dropdown-toggle");
    if (list) list.classList.add("w--open");
    if (toggle) toggle.classList.add("w--open");
    drop.classList.add("w--open");
  }

  function isDropdownOpen(drop) {
    return drop.classList.contains("w--open");
  }

  function anyOtherOpen(keep) {
    var open = false;
    dropdowns().forEach(function (drop) {
      if (drop !== keep && isDropdownOpen(drop)) open = true;
    });
    return open;
  }

  function clearCloseTimer(drop) {
    if (!closeTimers.has(drop)) return;
    clearTimeout(closeTimers.get(drop));
    closeTimers.delete(drop);
  }

  function closeDropdown(drop, immediate) {
    clearCloseTimer(drop);
    if (immediate) {
      applyClose(drop);
      return;
    }
    var list = dropdownList(drop);
    var toggle = drop.querySelector(".w-dropdown-toggle");
    var attrDelay = parseInt(drop.getAttribute("data-delay") || "0", 10);
    var delay = Math.max(CLOSE_MS, attrDelay || 0);
    closeTimers.set(
      drop,
      setTimeout(function () {
        closeTimers.delete(drop);
        if (isPointerOverDrop(drop)) return;
        applyClose(drop);
      }, delay)
    );
  }

  function closeAllExcept(keep) {
    dropdowns().forEach(function (drop) {
      if (drop !== keep) closeDropdown(drop, true);
    });
  }

  function cancelPendingOpen() {
    if (pendingOpenTimer) {
      clearTimeout(pendingOpenTimer);
      pendingOpenTimer = null;
    }
    pendingOpenDrop = null;
  }

  function onEnter(drop) {
    if (!mql.matches) return;
    clearCloseTimer(drop);
    dropdowns().forEach(function (d) {
      if (d !== drop) clearCloseTimer(d);
    });

    var switching = anyOtherOpen(drop);
    cancelPendingOpen();
    pendingOpenDrop = drop;

    if (switching) {
      closeAllExcept(drop);
      pendingOpenTimer = setTimeout(function () {
        pendingOpenTimer = null;
        if (!mql.matches || pendingOpenDrop !== drop) return;
        if (!isPointerOverDrop(drop)) {
          pendingOpenDrop = null;
          return;
        }
        closeAllExcept(drop);
        openDropdown(drop);
        pendingOpenDrop = null;
      }, SWITCH_OPEN_MS);
      return;
    }

    closeAllExcept(drop);
    openDropdown(drop);
    pendingOpenDrop = null;
  }

  function onLeave(drop) {
    if (!mql.matches) return;
    if (pendingOpenDrop === drop) cancelPendingOpen();
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
