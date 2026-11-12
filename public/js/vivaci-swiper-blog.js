/**
 * Homepage blog carousel (.swiper3) — same arrow design as swiper-tuesday.
 */
(function () {
  if (window.__vivaciSwiperBlogLoaded) return;
  window.__vivaciSwiperBlogLoaded = true;

  function initBlogSwiper() {
    if (typeof Swiper === "undefined") return;
    var root = document.querySelector(".swiper3");
    if (!root || root.dataset.vivaciSwiperBlogInit === "1") return;
    var slideCount = root.querySelectorAll(".swiper-wrapper > .swiper-slide").length;
    if (slideCount < 1) return;

    root.dataset.vivaciSwiperBlogInit = "1";

    if (window.vivaciDecorateSwiperArrows) {
      window.vivaciDecorateSwiperArrows(document);
    }

    var useLoop = slideCount > 3;

    new Swiper(root, {
      direction: "horizontal",
      slidesPerView: 1.25,
      slidesPerGroup: 1,
      spaceBetween: 20,
      loop: useLoop,
      parallax: true,
      centeredSlides: false,
      mousewheel: { forceToAxis: true },
      speed: 300,
      breakpoints: {
        480: { slidesPerView: 1.25 },
        768: { slidesPerView: Math.min(2.25, slideCount) },
        992: { slidesPerView: Math.min(3, slideCount) },
      },
      navigation: {
        nextEl: ".button-next-3",
        prevEl: ".button-prev-3",
      },
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.resolve(window.__vivaciHomeBlogReady).then(initBlogSwiper);
  });
})();
