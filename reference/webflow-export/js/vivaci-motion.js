/**
 * Shared motion presets for GSAP (and reference for CSS tokens).
 * Load before vivaci-quiz.js or other animated UI.
 */
(function (global) {
  function prefersReducedMotion() {
    return (
      global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function gsapReady() {
    return typeof global.gsap !== "undefined" && !prefersReducedMotion();
  }

  global.VivaciMotion = {
    sectionRevealsEnabled: false,
    prefersReducedMotion: prefersReducedMotion,
    gsapReady: gsapReady,
    duration: {
      instant: 0.12,
      fast: 0.2,
      normal: 0.32,
      slow: 0.42,
      modalIn: 0.36,
      modalOut: 0.24,
      stepIn: 0.28,
      stepOut: 0.18,
    },
    ease: {
      out: "power2.out",
      in: "power2.in",
      emphasis: "power3.out",
    },
    distance: {
      sm: 12,
      md: 20,
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
