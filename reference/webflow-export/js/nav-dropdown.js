/**
 * Desktop mega-menu motion (>= 992px), synced with Webflow w--open.
 * Open/close is handled by vivaci-nav-dropdown-fix.js; this file animates panels.
 */
(function () {
  var ROOT = ".navbar2_component";
  var SELECTOR =
    ROOT + " .navbar7_menu-dropdown, " + ROOT + " .navbar14_menu-dropdown";
  var DESKTOP_MQ = "(min-width: 992px)";
  var SWITCH_MS = 280;

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

  function setToggleBackground(dropdown, isOpen) {
    if (!isDesktop()) return;
    var toggle = dropdown.querySelector(".navbar14_dropdown-toggle");
    if (!toggle) return;
    toggle.style.backgroundColor = isOpen ? "#F5F2F0" : "";
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

  function staggerEach(count) {
    return Math.min(0.014, count > 0 ? 0.42 / count : 0.014);
  }

  function animateClose(dropdown, fast) {
    if (!isDesktop() || typeof gsap === "undefined" || prefersReducedMotion()) {
      resetDropdown(dropdown);
      return;
    }
    var elements = getElements(dropdown);
    if (!elements) return;
    var links = elements.links;
    var dur = fast ? 0.18 : 0.26;
    killAnimations(elements);
    gsap.to(elements.list, {
      opacity: 0,
      y: fast ? 8 : 12,
      scale: 0.98,
      transformOrigin: "top center",
      duration: dur,
      ease: "power2.in",
      overwrite: true,
    });
    gsap.to(links, {
      opacity: 0,
      y: 6,
      duration: dur * 0.85,
      stagger: { each: staggerEach(links.length) * 0.6, from: "end" },
      ease: "power2.in",
      overwrite: true,
    });
    if (elements.chevron) {
      gsap.to(elements.chevron, {
        rotation: 0,
        duration: 0.2,
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
    var links = elements.links;

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
    setToggleBackground(dropdown, true);

    gsap.set(elements.list, { transformOrigin: "top center", opacity: 1 });
    gsap.fromTo(
      elements.list,
      { opacity: 0, y: 14, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.34,
        ease: "power3.out",
        overwrite: true,
      }
    );
    if (links.length) {
      gsap.fromTo(
        links,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: { each: staggerEach(links.length), from: "start" },
          ease: "power2.out",
          overwrite: true,
        }
      );
    }
    if (elements.chevron) {
      gsap.to(elements.chevron, {
        rotation: 180,
        duration: 0.22,
        ease: "power3.out",
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
          animateOpen(dropdown);
          return;
        }

        if (activeDropdown !== dropdown) {
          resetDropdown(dropdown);
          return;
        }

        activeDropdown = null;
        animateClose(dropdown, false);
        gsap.delayedCall(0.32, function () {
          if (!list.classList.contains("w--open")) {
            resetDropdown(dropdown);
          }
        });
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
