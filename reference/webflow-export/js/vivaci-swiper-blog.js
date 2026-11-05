/**
 * Homepage blog carousel (.swiper3) — same arrow design as swiper-tuesday.
 */
(function () {
  if (window.__vivaciSwiperBlogLoaded) return;
  window.__vivaciSwiperBlogLoaded = true;

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof Swiper === "undefined") return;
    var root = document.querySelector(".swiper3");
    if (!root || root.dataset.vivaciSwiperBlogInit === "1") return;
    root.dataset.vivaciSwiperBlogInit = "1";

    if (window.vivaciDecorateSwiperArrows) {
      window.vivaciDecorateSwiperArrows(document);
    }

    new Swiper(root, {
      direction: "horizontal",
      slidesPerView: 1.25,
      slidesPerGroup: 1,
      spaceBetween: 20,
      loop: true,
      parallax: true,
      centeredSlides: false,
      mousewheel: { forceToAxis: true },
      speed: 300,
      breakpoints: {
        480: { slidesPerView: 1.25 },
        768: { slidesPerView: 2.25 },
        992: { slidesPerView: 2.5 },
      },
      navigation: {
        nextEl: ".button-next-3",
        prevEl: ".button-prev-3",
      },
    });
  });
})();
