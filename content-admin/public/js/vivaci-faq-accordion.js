/**
 * FAQ accordions (.faq3_list) — Webflow interactions don't apply after JS hydration.
 */
(function () {
  if (window.__vivaciFaqAccordionLoaded) return;
  window.__vivaciFaqAccordionLoaded = true;

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function setAnswerHeight(answer, height) {
    if (!answer) return;
    if (typeof gsap !== "undefined" && !prefersReducedMotion()) {
      gsap.set(answer, { height: height, overflow: "hidden" });
      return;
    }
    answer.style.height = height === "auto" ? "auto" : height === 0 ? "0px" : String(height);
    answer.style.overflow = "hidden";
  }

  function animateAnswer(answer, toAuto, icon, open) {
    if (typeof gsap !== "undefined" && !prefersReducedMotion()) {
      gsap.to(answer, {
        height: toAuto ? "auto" : 0,
        duration: toAuto ? 0.65 : 0.55,
        ease: toAuto ? "power3.inOut" : "power3.inOut",
        overwrite: true,
      });
      gsap.to(icon, {
        rotation: open ? 45 : 0,
        duration: open ? 0.45 : 0.4,
        ease: open ? "power2.out" : "power2.inOut",
        overwrite: true,
      });
      return;
    }
    setAnswerHeight(answer, toAuto ? "auto" : 0);
    if (icon) icon.style.transform = open ? "rotate(45deg)" : "";
  }

  function initFaqList(list) {
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll(".faq3_accordion"));
    if (!items.length) return;

    items.forEach(function (item, index) {
      if (item.getAttribute("data-vivaci-faq-item-bound") === "true") return;

      var question = item.querySelector(".faq3_question");
      var answer = item.querySelector(".faq3_answer");
      var icon = item.querySelector(".faq3_icon-wrapper");
      if (!question || !answer) return;

      item.setAttribute("data-vivaci-faq-item-bound", "true");
      var isFirst = index === 0;
      setAnswerHeight(answer, isFirst ? "auto" : 0);
      if (icon) {
        if (typeof gsap !== "undefined") gsap.set(icon, { rotation: isFirst ? 45 : 0 });
        else icon.style.transform = isFirst ? "rotate(45deg)" : "";
      }
      item.classList.toggle("is-open", isFirst);
      question.setAttribute("role", "button");
      question.setAttribute("tabindex", "0");
      question.setAttribute("aria-expanded", isFirst ? "true" : "false");

      function closeOthers() {
        items.forEach(function (other) {
          if (other === item || !other.classList.contains("is-open")) return;
          var oAnswer = other.querySelector(".faq3_answer");
          var oIcon = other.querySelector(".faq3_icon-wrapper");
          var oQ = other.querySelector(".faq3_question");
          other.classList.remove("is-open");
          if (oQ) oQ.setAttribute("aria-expanded", "false");
          animateAnswer(oAnswer, false, oIcon, false);
        });
      }

      function toggle() {
        var wasOpen = item.classList.contains("is-open");
        closeOthers();
        if (!wasOpen) {
          item.classList.add("is-open");
          question.setAttribute("aria-expanded", "true");
          animateAnswer(answer, true, icon, true);
        }
      }

      question.addEventListener("click", toggle);
      question.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });

    list.setAttribute("data-vivaci-faq-bound", "true");
  }

  function refresh(list) {
    if (!list) return;
    list.querySelectorAll(".faq3_accordion").forEach(function (item) {
      item.removeAttribute("data-vivaci-faq-item-bound");
    });
    list.removeAttribute("data-vivaci-faq-bound");
    initFaqList(list);
  }

  window.VivaciFaqAccordion = { init: initFaqList, refresh: refresh };

  function bootNonHomeFaqs() {
    document.querySelectorAll(".faq3_list").forEach(function (list) {
      if (list.closest("#vivaci-home-faq")) return;
      initFaqList(list);
    });
  }

  function bootHomeFaqWhenReady() {
    Promise.resolve(window.__vivaciHomeFaqReady).then(function () {
      var homeList = document.querySelector("#vivaci-home-faq .faq3_list");
      if (homeList) refresh(homeList);
    });
  }

  function boot() {
    bootNonHomeFaqs();
    bootHomeFaqWhenReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
