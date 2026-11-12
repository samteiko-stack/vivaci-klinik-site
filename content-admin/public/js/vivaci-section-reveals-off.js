/**
 * Disable Webflow IX scroll reveals inside page sections (header6 CTA, footer, etc.).
 * Nav dropdowns and modals are outside this scope.
 */
(function () {
  if (window.__vivaciSectionRevealsOff) return;
  window.__vivaciSectionRevealsOff = true;

  var SECTION_SEL = "section.is-section, header.is-section, footer.is-section";
  var BLOG_SEL =
    "#vivaci-home-blog, " +
    "#vivaci-home-blog *, " +
    ".timeline18_component .swiper-slide, " +
    ".timeline18_component .blog34_item, " +
    ".timeline18_component .blog34_item *, " +
    ".swiper3 .swiper-slide, " +
    ".swiper3 .blog34_item, " +
    ".swiper3 .blog34_item *";
  var TARGET_SEL =
    SECTION_SEL +
    " [data-w-id], " +
    SECTION_SEL +
    " .header6_content, " +
    SECTION_SEL +
    " .header6_content *, " +
    BLOG_SEL;

  function unhide(el) {
    if (!el || !el.style) return;
    el.style.setProperty("opacity", "1", "important");
    el.style.setProperty("transform", "none", "important");
    el.style.setProperty("-webkit-transform", "none", "important");
    el.style.setProperty("filter", "none", "important");
    el.style.setProperty("visibility", "visible", "important");
  }

  function unhideAll() {
    document.querySelectorAll(TARGET_SEL).forEach(unhide);
    document.querySelectorAll(SECTION_SEL).forEach(unhide);
    disableBlogGsapReveal();
  }

  function disableBlogGsapReveal() {
    document
      .querySelectorAll(
        "#vivaci-home-blog [is-div], .swiper3 .swiper-wrapper[is-div], .timeline18_component [is-div]"
      )
      .forEach(function (container) {
        container.removeAttribute("is-div");
        var kids = Array.prototype.slice.call(container.children);
        kids.forEach(unhide);
        try {
          if (typeof gsap !== "undefined") {
            gsap.killTweensOf(kids);
            gsap.set(kids, { clearProps: "opacity,transform,filter,y,willChange" });
          }
        } catch (_) {}
      });

    try {
      if (
        typeof ScrollTrigger !== "undefined" &&
        typeof ScrollTrigger.getAll === "function"
      ) {
        ScrollTrigger.getAll().forEach(function (st) {
          var trigger = st && st.trigger;
          if (
            trigger &&
            trigger.closest &&
            (trigger.closest("#vivaci-home-blog") ||
              trigger.closest(".timeline18_component") ||
              trigger.closest(".swiper3"))
          ) {
            st.kill();
          }
        });
      }
    } catch (_) {}
  }

  function hookWebflowIx() {
    try {
      if (typeof Webflow === "undefined" || !Webflow.require) return;
      var ix2 = Webflow.require("ix2");
      if (!ix2 || !ix2.init || ix2.__vivaciSectionRevealPatched) return;
      ix2.__vivaciSectionRevealPatched = true;
      var origInit = ix2.init;
      ix2.init = function () {
        var result = origInit.apply(this, arguments);
        unhideAll();
        return result;
      };
    } catch (_) {}
  }

  unhideAll();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", unhideAll);
  }
  window.addEventListener("load", function () {
    unhideAll();
    hookWebflowIx();
  });
  hookWebflowIx();

  var bursts = 0;
  var interval = window.setInterval(function () {
    unhideAll();
    bursts += 1;
    if (bursts >= 24) window.clearInterval(interval);
  }, 200);
})();
