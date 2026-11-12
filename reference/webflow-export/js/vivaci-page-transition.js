/**
 * Page enter (cold load) + in-site nav hint for @view-transition (MPA).
 * No fade-out before navigation — that caused white flicker between pages.
 */
(function () {
  if (window.__vivaciPageTransition) return;
  window.__vivaciPageTransition = true;

  var root = document.documentElement;
  var NAV_KEY = "vivaci-internal-nav";
  var SHELL_FALLBACK_MS = 2500;

  function revealFallbackMs() {
    var kind = pathKind();
    if (kind === "treatment") return 4500;
    if (kind === "listing" || kind === "course") return 3500;
    return SHELL_FALLBACK_MS;
  }
  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clearNavFlag() {
    root.classList.remove("vivaci-page-nav");
    try {
      sessionStorage.removeItem(NAV_KEY);
    } catch (_) {}
  }

  function pathKind() {
    var p = window.location.pathname || "";
    if (/^\/(problem|behandlingar|plastikkirurgi)\/[^/]+\/?$/.test(p)) {
      return "treatment";
    }
    if (p === "/behandlingar" || p === "/utbildning" || p === "/prislista") {
      return "listing";
    }
    if (/^\/utbildning\/[^/]+\/?$/.test(p)) return "course";
    return "static";
  }

  function whenContentReady() {
    var kind = pathKind();
    if (kind === "static") return Promise.resolve();

    var timeoutMs = kind === "treatment" ? 4000 : 3000;
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      window.setTimeout(finish, timeoutMs);
      if (kind === "treatment") {
        document.addEventListener("vivaci:treatment-page-ready", finish, { once: true });
        return;
      }
      if (kind === "listing") {
        document.addEventListener("vivaci:listing-ready", finish, { once: true });
        return;
      }
      if (kind === "course") {
        if (root.getAttribute("data-vivaci-course-hydrated")) {
          finish();
          return;
        }
        document.addEventListener("vivaci:course-page-ready", finish, { once: true });
        return;
      }
      finish();
    });
  }

  var revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    root.classList.remove("vivaci-page-loading");
    root.classList.add("vivaci-page-ready");
    clearNavFlag();
  }

  function waitForPaint() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function isNarrowViewport() {
    return window.matchMedia && window.matchMedia("(max-width: 991px)").matches;
  }

  function whenDomReady() {
    return new Promise(function (resolve) {
      if (document.readyState !== "loading") resolve();
      else document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
  }

  function whenEvent(name) {
    return new Promise(function (resolve) {
      if (name === "vivaci:nav-actions-ready" && root.classList.contains("vivaci-nav-ready")) {
        resolve();
        return;
      }
      if (name === "vivaci:nav-ready" && window.__vivaciNavReady) {
        resolve();
        return;
      }
      if (name === "vivaci:cart-hydrated" && window.__vivaciCartHydrated) {
        resolve();
        return;
      }
      document.addEventListener(name, resolve, { once: true });
    });
  }

  function whenShellReady() {
    var fontsReady = Promise.resolve();
    if (!isNarrowViewport() && document.fonts && document.fonts.ready) {
      fontsReady = document.fonts.ready;
    }
    var placeholdersReady = window.__vivaciPlaceholdersReady
      ? Promise.resolve(window.__vivaciPlaceholdersReady)
      : Promise.resolve();
    return Promise.all([
      whenDomReady(),
      fontsReady,
      placeholdersReady,
      whenEvent("vivaci:nav-actions-ready"),
      whenEvent("vivaci:cart-hydrated"),
      whenEvent("vivaci:nav-ready"),
    ]);
  }

  if (reduced) {
    reveal();
  } else {
    if (!root.classList.contains("vivaci-page-loading")) {
      root.classList.add("vivaci-page-loading");
    }
    var ready = Promise.all([whenShellReady(), whenContentReady()])
      .then(waitForPaint)
      .then(reveal);
    window.setTimeout(reveal, revealFallbackMs());
    ready.catch(function () {
      reveal();
    });
  }

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) reveal();
  });

  if (reduced) return;

  function shouldMarkInternalNav(a, e) {
    if (!a || !a.href) return false;
    if (a.hasAttribute("download") || a.target === "_blank") return false;
    if (a.hasAttribute("data-vivaci-no-transition")) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.classList.contains("w-lightbox") || a.classList.contains("w-dropdown-toggle")) {
      return false;
    }
    var href = a.getAttribute("href") || "";
    if (
      !href ||
      href === "#" ||
      href.charAt(0) === "#" ||
      href.indexOf("mailto:") === 0 ||
      href.indexOf("tel:") === 0 ||
      href.indexOf("javascript:") === 0
    ) {
      return false;
    }
    var url;
    try {
      url = new URL(a.href, window.location.href);
    } catch (_) {
      return false;
    }
    if (url.origin !== window.location.origin) return false;
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash === window.location.hash
    ) {
      return false;
    }
    return true;
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest("a[href]");
      if (!shouldMarkInternalNav(a, e)) return;
      try {
        sessionStorage.setItem(NAV_KEY, "1");
      } catch (_) {}
    },
    true
  );

  var prefetched = Object.create(null);
  document.addEventListener(
    "mouseover",
    function (e) {
      var a = e.target.closest("a[href]");
      if (!shouldMarkInternalNav(a, e)) return;
      var url;
      try {
        url = new URL(a.href, window.location.href).href;
      } catch (_) {
        return;
      }
      if (prefetched[url]) return;
      prefetched[url] = true;
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);
    },
    { passive: true }
  );
})();
