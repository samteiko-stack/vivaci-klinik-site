/**
 * Homepage marketing copy from content/homepage-copy.json
 */
(function () {
  if (window.__vivaciHomepageCopyLoaded) return;
  window.__vivaciHomepageCopyLoaded = true;

  var COPY_URL = "/content/homepage-copy.json";
  var FAQ_URL = "/content/from-production/home-faq.json";

  function fetchContent(path) {
    if (window.VivaciI18n && window.VivaciI18n.fetchContent) {
      return window.VivaciI18n.fetchContent(path);
    }
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error(path + " " + res.status);
      return res.json();
    });
  }

  function setText(el, text) {
    if (el && text) el.textContent = text;
  }

  function setCta(link, cta) {
    if (!link || !cta) return;
    if (cta.href) link.href = cta.href;
    var label = link.querySelector("div");
    if (label && cta.label) label.textContent = cta.label;
  }

  function applyHero(data) {
    var root = document.getElementById("vivaci-home-hero");
    if (!root || !data) return;
    setText(root.querySelector('[data-vivaci-field="hero-tagline"]'), data.tagline);
    setText(root.querySelector('[data-vivaci-field="hero-title"]'), data.title);
    setText(root.querySelector('[data-vivaci-field="hero-intro"]'), data.intro);
    setCta(root.querySelector('[data-vivaci-field="hero-cta-primary"]'), data.primaryCta);
    setCta(root.querySelector('[data-vivaci-field="hero-cta-secondary"]'), data.secondaryCta);
  }

  function applyMethod(data) {
    if (!data) return;
    var root = document.getElementById("vivaci-home-method");
    if (root) {
      setText(root.querySelector('[data-vivaci-field="method-tagline"]'), data.tagline);
      setText(root.querySelector('[data-vivaci-field="method-heading"]'), data.heading);
      setText(root.querySelector('[data-vivaci-field="method-intro"]'), data.intro);
      setCta(root.querySelector('[data-vivaci-field="method-cta"]'), data.cta);
    }
    if (!Array.isArray(data.steps)) return;
    var steps = document.querySelectorAll(
      "#vivaci-home-method [data-vivaci-field=\"method-step-body\"]"
    );
    data.steps.forEach(function (step, i) {
      if (!steps[i]) return;
      setText(steps[i], step.body);
      var item = steps[i].closest(".timeline1_item");
      var title = item
        ? item.querySelector('[data-vivaci-field="method-step-title"], h4')
        : null;
      if (title && step.title) title.textContent = step.title;
    });
  }

  function applyProblems(data) {
    if (!data) return;
    setText(document.querySelector('[data-vivaci-field="problems-tagline"]'), data.tagline);
    setText(document.querySelector('[data-vivaci-field="problems-heading"]'), data.heading);
    setText(document.querySelector('[data-vivaci-field="problems-intro"]'), data.intro);
    setCta(document.querySelector('[data-vivaci-field="problems-cta"]'), data.cta);
  }

  function applyFinder(data) {
    var root = document.getElementById("vivaci-treatment-finder");
    if (!root || !data) return;
    setText(root.querySelector('[data-vivaci-field="finder-heading"]'), data.heading);
    setText(root.querySelector('[data-vivaci-field="finder-intro"]'), data.intro);
    var input = root.querySelector('[data-vivaci-field="finder-search"]');
    if (input && data.searchPlaceholder) input.placeholder = data.searchPlaceholder;
    var quizBlock = root.closest(".is-section") || root.parentElement;
    if (quizBlock && data.quizHint) {
      setText(quizBlock.querySelector("[data-vivaci-field=\"finder-quiz-hint\"]"), data.quizHint);
    }
    var quizBtn = document.querySelector("[data-vivaci-quiz-trigger] div");
    if (quizBtn && data.quizCta) quizBtn.textContent = data.quizCta;
  }

  function applyFeatured(data) {
    var root = document.getElementById("vivaci-home-featured-treatments");
    if (!root || !data) return;
    setText(root.querySelector('[data-vivaci-field="featured-tagline"]'), data.tagline);
    setText(root.querySelector('[data-vivaci-field="featured-heading"]'), data.heading);
    setText(root.querySelector('[data-vivaci-field="featured-intro"]'), data.intro);
    setCta(root.querySelector('[data-vivaci-field="featured-cta"]'), data.cta);
  }

  function fillFaqList(listEl, faqs) {
    if (!listEl || !faqs || !faqs.length) return;
    var template = listEl.querySelector(".faq3_accordion");
    if (!template) return;
    var parent = template.parentElement;
    parent.innerHTML = "";
    faqs.forEach(function (faq, i) {
      var node = template.cloneNode(true);
      var q = node.querySelector(
        ".faq3_question .heading-style-h5, .faq3_question-text, .text-size-medium"
      );
      var a = node.querySelector(
        ".faq3_answer .text-style-muted, .faq3_answer-text, .text-size-regular"
      );
      if (q) q.textContent = faq.question || "";
      if (a) a.textContent = faq.answer || "";
      node.classList.toggle("is-open", i === 0);
      var toggle = node.querySelector(".faq3_question");
      if (toggle) toggle.setAttribute("aria-expanded", i === 0 ? "true" : "false");
      parent.appendChild(node);
    });
  }

  function applyFaq(data) {
    var root = document.getElementById("vivaci-home-faq");
    if (!root || !data) return;
    setText(root.querySelector('[data-vivaci-field="faq-tagline"]'), data.tagline);
    setText(root.querySelector('[data-vivaci-field="faq-heading"]'), data.heading);
    setText(root.querySelector('[data-vivaci-field="faq-intro"]'), data.intro);
    setCta(root.querySelector('[data-vivaci-field="faq-cta"]'), data.cta);
    var listEl = root.querySelector(".faq3_list");
    fillFaqList(listEl, data.items);
    if (window.VivaciFaqAccordion && listEl) {
      window.VivaciFaqAccordion.refresh(listEl);
    }
  }

  function hydrateHomepageCopy() {
    return Promise.all([
      fetchContent(COPY_URL).catch(function () {
        return {};
      }),
      fetchContent(FAQ_URL).catch(function () {
        return null;
      }),
    ])
      .then(function (results) {
        var copy = results[0];
        var faq = results[1];
        applyHero(copy.hero);
        applyMethod(copy.method);
        applyProblems(copy.problems);
        applyFinder(copy.treatmentFinder);
        applyFeatured(copy.featuredTreatments);
        applyFaq(faq);
      })
      .catch(function (err) {
        console.warn("[vivaci] homepage copy:", err);
      });
  }

  function scheduleHydrate() {
    var run = function () {
      window.__vivaciHomeFaqReady = hydrateHomepageCopy();
    };
    var wait =
      window.VivaciI18n && window.VivaciI18n.whenReady
        ? window.VivaciI18n.whenReady()
        : window.__vivaciI18nReady;
    if (wait && wait.then) wait.then(run);
    else run();
  }

  scheduleHydrate();
  document.addEventListener("vivaci:i18n-ready", scheduleHydrate);
  document.addEventListener("vivaci:locale-change", function () {
    var wait =
      window.VivaciI18n && window.VivaciI18n.whenReady
        ? window.VivaciI18n.whenReady()
        : null;
    if (wait && wait.then) wait.then(scheduleHydrate);
    else scheduleHydrate();
  });
})();
