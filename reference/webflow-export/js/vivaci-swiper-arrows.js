/**
 * Shared chevron SVG for all Swiper navigation buttons.
 */
(function () {
  if (window.__vivaciSwiperArrowsLoaded) return;
  window.__vivaciSwiperArrowsLoaded = true;

  window.VIVACI_SWIPER_ARROW_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right" aria-hidden="true" role="img"><path d="m9 18 6-6-6-6"/></svg>';

  function decorate(el) {
    if (!el || el.querySelector("svg")) return;
    el.innerHTML = window.VIVACI_SWIPER_ARROW_SVG;
    el.classList.add("vivaci-swiper-btn");
    if (el.classList.contains("button-prev-3") || el.classList.contains("swiper-tuesday-prev")) {
      el.classList.add("is-prev");
    }
    if (el.classList.contains("button-next-3") || el.classList.contains("swiper-tuesday-next")) {
      el.classList.add("is-next");
    }
  }

  function decorateAll(root) {
    var scope = root || document;
    scope.querySelectorAll(
      ".vivaci-swiper-btn, .swiper-tuesday-prev, .swiper-tuesday-next, a.swiper-arrow, button.swiper-arrow"
    ).forEach(decorate);
  }

  window.vivaciDecorateSwiperArrows = decorateAll;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      decorateAll(document);
    });
  } else {
    decorateAll(document);
  }
})();
