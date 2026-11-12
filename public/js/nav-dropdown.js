/**
 * Desktop mega-menu motion (>= 992px), synced with Webflow w--open.
 * Open/close is handled by vivaci-nav-dropdown-fix.js; this file animates panels.
 * Single panel fade + short translate — no child stagger, scale, or blur.
 */
(function () {
  var ROOT = ".navbar2_component";
  var SELECTOR =
    ROOT + " .navbar7_menu-dropdown, " + ROOT + " .navbar14_menu-dropdown";
  var DESKTOP_MQ = "(min-width: 992px)";
  var SWITCH_MS = 180;
  var PANEL_IN_S = 0.2;
  var PANEL_OUT_S = 0.16;
  var PANEL_Y_PX = 6;

  var mql = window.matchMedia(DESKTOP_MQ);
  var activeDropdown = null;
  var switching = false;
  var switchTimer = null;
  var teardowns = [];

  function isDesktop() {
    return mql.matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function visibleLinks(list) {
    return Array.prototype.filter.call(
      list.querySelectorAll(
        ".navbar12_dropdown-link, .navbar14_dropdown-link, .navbar10_blog-item"
      ),
      function (el) {
        return el.style.display !== "none" && !el.hasAttribute("data-nav-hidden");
      }
    );
  }

  function getElements(dropdown) {
    var list = dropdown.querySelector(
      ".navbar7_dropdown-list, .navbar14_dropdown-list"
    );
    if (!list) return null;
    return {
      list: list,
      links: visibleLinks(list),
      chevron: dropdown.querySelector(".dropdown-chevron"),
    };
  }

  function setToggleBackground() {
    /* Open/hover fill: nav-fixes.css (.w-dropdown.w--open > .navbar14_dropdown-toggle) */
  }

  function killAnimations(elements) {
    if (!elements || typeof gsap === "undefined") return;
    gsap.killTweensOf(elements.list);
    gsap.killTweensOf(elements.links);
    if (elements.chevron) gsap.killTweensOf(elements.chevron);
  }

  function resetDropdown(dropdown) {
    var elements = getElements(dropdown);
    if (!elements) return;
    killAnimations(elements);
    if (typeof gsap !== "undefined") {
      gsap.set(elements.list, {
        clearProps: "opacity,transform,transformOrigin,filter",
      });
      gsap.set(elements.links, { clearProps: "opacity,transform,filter" });
      if (elements.chevron) {
        gsap.set(elements.chevron, { clearProps: "transform" });
      }
    }
    var toggle = dropdown.querySelector(".navbar14_dropdown-toggle");
    if (toggle) toggle.style.backgroundColor = "";
  }

  function resetAllDropdowns() {
    document.querySelectorAll(SELECTOR).forEach(resetDropdown);
  }

  function setLinksVisible(elements) {
    if (!elements || typeof gsap === "undefined") return;
    gsap.set(elements.links, { opacity: 1, y: 0, filter: "none" });
  }

  function animateClose(dropdown, fast) {
    if (!isDesktop() || typeof gsap === "undefined" || prefersReducedMotion()) {
      resetDropdown(dropdown);
      return;
    }
    var elements = getElements(dropdown);
    if (!elements) return;
    var dur = fast ? PANEL_OUT_S : PANEL_OUT_S * 1.15;
    killAnimations(elements);
    setLinksVisible(elements);
    gsap.to(elements.list, {
      opacity: 0,
      y: PANEL_Y_PX,
      duration: dur,
      ease: "power2.in",
      overwrite: true,
    });
    if (elements.chevron) {
      gsap.to(elements.chevron, {
        rotation: 0,
        duration: PANEL_OUT_S,
        ease: "power2.out",
        overwrite: true,
      });
    }
    setToggleBackground(dropdown, false);
  }

  function animateOpen(dropdown) {
    if (!isDesktop() || typeof gsap === "undefined" || prefersReducedMotion()) {
      setToggleBackground(dropdown, true);
      return;
    }
    var elements = getElements(dropdown);
    if (!elements) return;

    if (activeDropdown && activeDropdown !== dropdown) {
      switching = true;
      animateClose(activeDropdown, true);
      if (switchTimer) clearTimeout(switchTimer);
      switchTimer = setTimeout(function () {
        switching = false;
        switchTimer = null;
      }, SWITCH_MS);
    }

    activeDropdown = dropdown;
    killAnimations(elements);
    resetDropdown(dropdown);
    setToggleBackground(dropdown, true);
    setLinksVisible(elements);

    gsap.set(elements.list, { transformOrigin: "top center", opacity: 1 });
    gsap.fromTo(
      elements.list,
      { opacity: 0, y: PANEL_Y_PX },
      {
        opacity: 1,
        y: 0,
        duration: PANEL_IN_S,
        ease: "power2.out",
        overwrite: true,
      }
    );
    if (elements.chevron) {
      gsap.to(elements.chevron, {
        rotation: 180,
        duration: PANEL_IN_S,
        ease: "power2.out",
        overwrite: true,
      });
    }
  }

  function destroy() {
    teardowns.forEach(function (fn) {
      fn();
    });
    teardowns = [];
    resetAllDropdowns();
    activeDropdown = null;
    switching = false;
    if (switchTimer) {
      clearTimeout(switchTimer);
      switchTimer = null;
    }
  }

  function initDesktop() {
    if (typeof gsap === "undefined") return;

    document.querySelectorAll(SELECTOR).forEach(function (dropdown) {
      var elements = getElements(dropdown);
      if (!elements) return;
      var list = elements.list;
      var wasOpenLocal = list.classList.contains("w--open");
      setToggleBackground(dropdown, wasOpenLocal);

      var observer = new MutationObserver(function () {
        if (!isDesktop()) return;
        var isOpen = list.classList.contains("w--open");
        if (isOpen === wasOpenLocal) return;
        wasOpenLocal = isOpen;
        setToggleBackground(dropdown, isOpen);

        if (isOpen) {
          requestAnimationFrame(function () {
            if (!list.classList.contains("w--open")) return;
            animateOpen(dropdown);
          });
          return;
        }

        if (activeDropdown === dropdown) {
          activeDropdown = null;
        }
        /* Panel is display:none once w--open drops — clear GSAP inline, skip close tween. */
        resetDropdown(dropdown);
      });

      observer.observe(list, {
        attributes: true,
        attributeFilter: ["class"],
      });

      teardowns.push(function () {
        observer.disconnect();
        resetDropdown(dropdown);
      });
    });
  }

  function init() {
    destroy();
    if (!isDesktop()) return;
    initDesktop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("vivaci:nav-ready", init);
  if (mql.addEventListener) {
    mql.addEventListener("change", init);
  } else if (mql.addListener) {
    mql.addListener(init);
  }
})();
