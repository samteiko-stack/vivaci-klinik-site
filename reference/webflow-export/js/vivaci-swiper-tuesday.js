/**
 * .swiper-tuesday carousels (problems, featured, etc.)
 */
(function () {
  if (window.__vivaciSwiperTuesdayLoaded) return;
  window.__vivaciSwiperTuesdayLoaded = true;

  var ARROW_SVG =
    window.VIVACI_SWIPER_ARROW_SVG ||
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right" aria-hidden="true" role="img"><path d="m9 18 6-6-6-6"/></svg>';

  function arrowSvg() {
    return ARROW_SVG;
  }

  function initTuesday(swiperEl) {
    if (swiperEl.dataset.vivaciSwiperTuesdayInit === "1") return;
    swiperEl.dataset.vivaciSwiperTuesdayInit = "1";

    var existingControls = swiperEl.nextElementSibling;
    var controls =
      existingControls && existingControls.classList.contains("swiper-tuesday-controls")
        ? existingControls
        : document.createElement("div");
    controls.className = "swiper-tuesday-controls";
    var svg = arrowSvg();
    controls.innerHTML =
      '<div class="swiper-tuesday-arrows">' +
      '<button class="swiper-tuesday-prev vivaci-swiper-btn is-prev" type="button" aria-label="Föregående slide">' +
      svg +
      "</button>" +
      '<button class="swiper-tuesday-next vivaci-swiper-btn is-next" type="button" aria-label="Nästa slide">' +
      svg +
      "</button>" +
      "</div>" +
      '<div class="swiper-tuesday-pagination"></div>';
    if (!controls.parentElement) {
      swiperEl.insertAdjacentElement("afterend", controls);
    }

    var ANIMATION_SPEED = 600;
    var EASING = "cubic-bezier(.22, 1, .36, 1)";
    var MIN_SCALE = 0.72;
    var MAX_BLUR = 3;
    swiperEl.style.setProperty("--swiper-wrapper-transition-timing-function", EASING);

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function updateCards(swiper) {
      if (!swiper || swiper.destroyed) return;
      var translate = swiper.translate || 0;
      var gap = Number(swiper.params.spaceBetween) || 0;
      swiper.slides.forEach(function (slide) {
        var card = slide.firstElementChild;
        if (!card) return;
        var distance = slide.swiperSlideSize + gap;
        if (!distance || !Number.isFinite(distance)) return;
        var position = slide.swiperSlideOffset + translate;
        if (position < 0 && position >= -distance) {
          var progress = clamp(-position / distance, 0, 1);
          var scale = 1 - (1 - MIN_SCALE) * progress;
          var offset = -position;
          card.style.transform = "translate3d(" + offset + "px, 0, 0) scale(" + scale + ")";
          card.style.opacity = String(1 - progress);
          card.style.filter = "blur(" + MAX_BLUR * progress + "px)";
          slide.style.zIndex = "0";
        } else {
          card.style.transform = "";
          card.style.opacity = "";
          card.style.filter = "";
          slide.style.zIndex = "";
        }
      });
    }

    function updateTransitions(swiper, duration) {
      var transition =
        duration > 0
          ? "transform " + duration + "ms " + EASING + ", opacity " + duration + "ms " + EASING + ", filter " + duration + "ms " + EASING
          : "none";
      swiper.slides.forEach(function (slide) {
        var card = slide.firstElementChild;
        if (card) card.style.transition = transition;
      });
    }

    var swiper = new Swiper(swiperEl, {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 16,
      speed: ANIMATION_SPEED,
      grabCursor: true,
      loop: true,
      loopAdditionalSlides: 3,
      watchSlidesProgress: true,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      updateOnWindowResize: true,
      resizeObserver: true,
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 24 },
      },
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      navigation: {
        nextEl: controls.querySelector(".swiper-tuesday-next"),
        prevEl: controls.querySelector(".swiper-tuesday-prev"),
      },
      pagination: {
        el: controls.querySelector(".swiper-tuesday-pagination"),
        clickable: true,
      },
      on: {
        init: function (sw) {
          updateTransitions(sw, 0);
          updateCards(sw);
        },
        setTranslate: function (sw) {
          updateCards(sw);
        },
        setTransition: function (sw, duration) {
          updateTransitions(sw, duration);
        },
        loopFix: function (sw) {
          updateCards(sw);
        },
        resize: function (sw) {
          updateCards(sw);
        },
        update: function (sw) {
          updateCards(sw);
        },
        slidesUpdated: function (sw) {
          updateCards(sw);
        },
        breakpoint: function (sw) {
          updateCards(sw);
        },
      },
    });

    requestAnimationFrame(function () {
      if (swiper.destroyed) return;
      swiper.update();
      updateTransitions(swiper, 0);
      updateCards(swiper);
    });
    window.addEventListener(
      "load",
      function () {
        if (swiper.destroyed) return;
        swiper.update();
        updateCards(swiper);
      },
      { once: true }
    );
  }

  window.vivaciInitSwiperTuesdayEl = initTuesday;

  function boot() {
    if (typeof Swiper === "undefined") return;
    document.querySelectorAll(".swiper-tuesday").forEach(initTuesday);
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      Promise.resolve(window.__vivaciHomeProblemsReady),
      Promise.resolve(window.__vivaciHomeFeaturedReady),
    ]).then(boot);
  });
})();
