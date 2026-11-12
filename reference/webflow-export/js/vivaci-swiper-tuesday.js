/**
 * .swiper-tuesday carousels (problems, featured, related, before/after, etc.)
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

  function visibleSlideCount(swiperEl) {
    return swiperEl.querySelectorAll(
      ".swiper-wrapper > .swiper-slide:not([hidden])"
    ).length;
  }

  function isDeferredSwiper(swiperEl) {
    if (swiperEl.getAttribute("data-vivaci-field") === "related-swiper") return true;
    if (swiperEl.getAttribute("data-vivaci-field") === "ba-swiper") return true;
    if (swiperEl.getAttribute("data-vivaci-field") === "product-rec-swiper") return true;
    return !!(
      swiperEl.closest('[data-vivaci-section="related"]') ||
      swiperEl.closest('[data-vivaci-section="beforeAfterGallery"]') ||
      swiperEl.closest("[data-vivaci-product-recommended]")
    );
  }

  /** PDP related + before/after: fixed .is-50p width, no stack-blur (homepage keeps carousel). */
  function isTreatmentCardSwiper(swiperEl) {
    var field = swiperEl.getAttribute("data-vivaci-field");
    if (field === "related-swiper") return true;
    if (field === "ba-swiper") return true;
    return !!(
      swiperEl.closest('[data-vivaci-section="related"]') ||
      swiperEl.closest('[data-vivaci-section="beforeAfterGallery"]')
    );
  }

  function retryDeferredInits() {
    if (typeof Swiper === "undefined") return;
    document.querySelectorAll(".swiper-tuesday").forEach(function (el) {
      if (!isDeferredSwiper(el)) return;
      if (visibleSlideCount(el) < 1) return;
      if (el.dataset.vivaciSwiperTuesdayInit === "1") return;
      initTuesday(el);
    });
  }

  function initTuesday(swiperEl) {
    if (!swiperEl || swiperEl.dataset.vivaciSwiperTuesdayInit === "1") return;
    if (typeof Swiper === "undefined") return;

    var slideCount = visibleSlideCount(swiperEl);
    if (slideCount < 1) return;
    if (isDeferredSwiper(swiperEl) && slideCount < 2) return;

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
    var isProductRec =
      swiperEl.getAttribute("data-vivaci-field") === "product-rec-swiper";
    var isTreatmentCards = isTreatmentCardSwiper(swiperEl);
    var useCarouselFx = !isProductRec && !isTreatmentCards;
    var useLoop = useCarouselFx && slideCount >= 3;
    if (isTreatmentCards) {
      swiperEl.classList.add("is-vivaci-treatment-cards");
    }
    swiperEl.style.setProperty("--swiper-wrapper-transition-timing-function", EASING);

    function effectiveSlidesPerView(count, cap) {
      if (count <= 1) return 1;
      return Math.min(cap, count - 0.5);
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function updateCards(swiper) {
      if (!useCarouselFx) return;
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

    var productRecBreakpoints = {
      480: {
        slidesPerView: Math.min(1.35, slideCount),
        spaceBetween: 12,
      },
      768: {
        slidesPerView: Math.min(2.5, slideCount),
        spaceBetween: 16,
      },
      992: {
        slidesPerView: Math.min(3.25, slideCount),
        spaceBetween: 20,
      },
      1200: {
        slidesPerView: Math.min(4, slideCount),
        spaceBetween: 20,
      },
    };

    var swiper = new Swiper(swiperEl, {
      slidesPerView: isTreatmentCards
        ? "auto"
        : isProductRec
          ? Math.min(1.2, slideCount)
          : effectiveSlidesPerView(slideCount, 1.25),
      slidesPerGroup: 1,
      spaceBetween: isTreatmentCards ? 20 : 16,
      speed: isTreatmentCards ? 450 : ANIMATION_SPEED,
      grabCursor: true,
      loop: useLoop,
      loopAdditionalSlides: useLoop ? Math.min(slideCount, 6) : 0,
      watchSlidesProgress: useCarouselFx,
      watchOverflow: true,
      observer: isTreatmentCards,
      observeParents: isTreatmentCards,
      updateOnWindowResize: true,
      resizeObserver: true,
      breakpoints: isTreatmentCards
        ? {
            768: { spaceBetween: 24 },
          }
        : isProductRec
          ? productRecBreakpoints
          : {
              768: {
                slidesPerView: effectiveSlidesPerView(slideCount, 2.25),
                spaceBetween: 24,
              },
            },
      autoplay:
        !isTreatmentCards && slideCount >= 2
          ? {
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
          : false,
      navigation: {
        nextEl: controls.querySelector(".swiper-tuesday-next"),
        prevEl: controls.querySelector(".swiper-tuesday-prev"),
      },
      pagination: {
        el: controls.querySelector(".swiper-tuesday-pagination"),
        clickable: true,
      },
      on: useCarouselFx
        ? {
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
          }
        : {
            init: function (sw) {
              requestAnimationFrame(function () {
                if (!sw.destroyed) sw.update();
              });
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
  window.vivaciRetryDeferredSwiperTuesday = retryDeferredInits;

  function boot() {
    if (typeof Swiper === "undefined") return;
    document.querySelectorAll(".swiper-tuesday").forEach(function (el) {
      if (isDeferredSwiper(el)) return;
      initTuesday(el);
    });
    retryDeferredInits();
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      Promise.resolve(window.__vivaciHomeProblemsReady),
      Promise.resolve(window.__vivaciHomeFeaturedReady),
      Promise.resolve(window.__vivaciHomeBlogReady),
    ]).then(boot);

    var attempts = 0;
    var poll = window.setInterval(function () {
      attempts += 1;
      retryDeferredInits();
      if (typeof Swiper !== "undefined" || attempts > 50) {
        window.clearInterval(poll);
      }
    }, 100);
  });

  document.addEventListener("vivaci:treatment-page-ready", retryDeferredInits);
  window.addEventListener("load", retryDeferredInits, { once: true });
})();
