/**
 * Vivaci treatment quiz — reusable modal, locale-driven config, any trigger:
 *   data-vivaci-quiz-trigger  or  data-vivaci-quiz-open
 * Optional: data-vivaci-quiz-locale="sv" (default sv)
 */
(function () {
  if (window.__vivaciQuizLoaded) return;
  window.__vivaciQuizLoaded = true;

  var DEFAULT_LOCALE = "sv";
  var QUIZ_BASE = "/content/quiz/locales/";
  var ROOT_ID = "vivaci-quiz-root";
  var triggerSelector = "[data-vivaci-quiz-trigger], [data-vivaci-quiz-open]";

  var state = {
    locale: DEFAULT_LOCALE,
    config: null,
    navByHref: {},
    answers: {},
    stepIndex: 0,
    phase: "idle",
    lastFocus: null,
  };

  var rootEl = null;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function quizPanel() {
    return rootEl ? $(".vivaci-quiz-panel", rootEl) : null;
  }

  function quizPanelInner() {
    return rootEl ? $(".vivaci-quiz-panel-inner", rootEl) : null;
  }

  function quizContentBlock() {
    var inner = quizPanelInner();
    return inner ? inner.firstElementChild : null;
  }

  function format(template, vars) {
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] != null ? String(vars[key]) : "";
    });
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function motion() {
    return typeof VivaciMotion !== "undefined" ? VivaciMotion : null;
  }

  function motionEnabled() {
    var m = motion();
    if (m) return m.gsapReady();
    return typeof gsap !== "undefined" && !prefersReducedMotion();
  }

  function dur(key) {
    var m = motion();
    if (m && m.duration[key] != null) return m.duration[key];
    var fallback = { modalIn: 0.36, modalOut: 0.24, stepIn: 0.28, stepOut: 0.18, normal: 0.32, slow: 0.42 };
    return fallback[key] != null ? fallback[key] : 0.32;
  }

  function ease(key) {
    var m = motion();
    if (m && m.ease[key]) return m.ease[key];
    if (key === "in") return "power2.in";
    if (key === "emphasis") return "power3.out";
    return "power2.out";
  }

  function dist(key) {
    var m = motion();
    if (m && m.distance[key] != null) return m.distance[key];
    return key === "md" ? 20 : 12;
  }

  var contentMotionSeq = 0;
  var modalClosing = false;

  function killContentMotion() {
    contentMotionSeq += 1;
    if (typeof gsap === "undefined" || !rootEl) return;
    var inner = quizPanelInner();
    if (!inner) return;
    gsap.killTweensOf(inner);
    gsap.killTweensOf(inner.querySelectorAll("*"));
  }

  function animateModalIn(overlay, panel) {
    if (!motionEnabled()) return;
    gsap.killTweensOf([overlay, panel]);
    gsap.set(overlay, { opacity: 0 });
    gsap.set(panel, { opacity: 0, y: dist("md"), scale: 0.98, transformOrigin: "50% 50%" });
    gsap.to(overlay, { opacity: 1, duration: dur("modalIn"), ease: ease("out") });
    gsap.to(panel, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: dur("modalIn"),
      ease: ease("emphasis"),
      clearProps: "transform",
    });
  }

  function animateModalOut(overlay, panel, done) {
    if (!motionEnabled()) {
      done();
      return;
    }
    gsap.killTweensOf([overlay, panel]);
    gsap.to(panel, {
      opacity: 0,
      y: dist("sm"),
      scale: 0.99,
      duration: dur("modalOut"),
      ease: ease("in"),
    });
    gsap.to(overlay, {
      opacity: 0,
      duration: dur("modalOut"),
      ease: ease("in"),
      onComplete: done,
    });
  }

  function animatePanelContentIn(direction) {
    var seq = contentMotionSeq;
    var block = quizContentBlock();
    if (!block) return;

    if (!motionEnabled()) return;

    var fromX =
      direction < 0 ? -dist("sm") : direction > 0 ? dist("sm") : 0;
    gsap.fromTo(
      block,
      { opacity: 0, x: fromX },
      {
        opacity: 1,
        x: 0,
        duration: dur("stepIn"),
        ease: ease("out"),
        clearProps: "transform,opacity",
      }
    );

    /* Options: no entrance animation — state only via CSS. Stagger results / intro CTA only. */
    var staggerTargets = block.querySelectorAll(
      ".vivaci-quiz-result-card, [data-quiz-start]"
    );
    if (staggerTargets.length) {
      gsap.fromTo(
        staggerTargets,
        { opacity: 0, y: dist("sm") * 0.75 },
        {
          opacity: 1,
          y: 0,
          duration: dur("stepIn"),
          stagger: { each: 0.04, max: 0.24 },
          ease: ease("out"),
          delay: 0.04,
          clearProps: "transform,opacity",
          onComplete: function () {
            if (seq !== contentMotionSeq) return;
          },
        }
      );
    }
  }

  function swapPanelContent(draw, direction) {
    var inner = quizPanelInner();
    if (!inner) return;

    killContentMotion();
    var hasContent =
      inner.firstElementChild &&
      !inner.querySelector(".vivaci-quiz-loading");

    if (!hasContent || !motionEnabled()) {
      draw();
      animatePanelContentIn(direction || 0);
      return;
    }

    var block = inner.firstElementChild;
    var exitX = direction > 0 ? -dist("sm") : direction < 0 ? dist("sm") : 0;
    gsap.to(block, {
      opacity: 0,
      x: exitX,
      duration: dur("stepOut"),
      ease: ease("in"),
      onComplete: function () {
        draw();
        animatePanelContentIn(direction || 0);
      },
    });
  }

  function lucideChevronRight() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
    );
  }

  function lucideChevronLeft() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
    );
  }

  function lucideX() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
    );
  }

  function lucideCheck() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
    );
  }

  function syncOptionSelectionClasses(panel) {
    panel.querySelectorAll(".vivaci-quiz-option").forEach(function (label) {
      var inp = label.querySelector(".vivaci-quiz-option-input");
      label.classList.toggle("is-selected", !!(inp && inp.checked));
    });
  }

  function updateOptionSelection(panel, q) {
    syncOptionSelectionClasses(panel);
    var nextBtn = $("[data-quiz-next]", panel);
    if (nextBtn) nextBtn.disabled = !isStepValid(q);
  }

  function buildNavIndex(navJson) {
    var map = {};
    (navJson.categories || []).forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        if (item.href) {
          map[item.href] = {
            label: item.label,
            description: item.description || "",
          };
        }
      });
    });
    return map;
  }

  function loadJson(url) {
    if (window.vivaciFetchJson) {
      return window.vivaciFetchJson(url);
    }
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
      return r.json();
    });
  }

  function loadQuiz(locale) {
    var quizUrl = QUIZ_BASE + locale + ".json";
    return loadJson(quizUrl).then(function (config) {
      var navUrl = config.meta && config.meta.navUrl;
      if (!navUrl) {
        state.navByHref = {};
        return config;
      }
      return loadJson(navUrl).then(function (nav) {
        state.navByHref = buildNavIndex(nav);
        return config;
      });
    });
  }

  function answerFor(questionId) {
    return state.answers[questionId];
  }

  function showIfMatches(showIf) {
    if (!showIf) return true;
    var val = answerFor(showIf.questionId);
    if (val == null) return false;
    if (Array.isArray(val)) {
      return val.indexOf(showIf.optionId) !== -1;
    }
    return val === showIf.optionId;
  }

  function visibleQuestions() {
    if (!state.config) return [];
    return state.config.questions.filter(function (q) {
      return showIfMatches(q.showIf);
    });
  }

  function ui(key) {
    return (state.config && state.config.ui && state.config.ui[key]) || "";
  }

  function ensureRoot() {
    if (rootEl && !quizPanelInner()) {
      rootEl.remove();
      rootEl = null;
    }
    if (rootEl) return rootEl;
    rootEl = document.createElement("div");
    rootEl.id = ROOT_ID;
    rootEl.className = "vivaci-quiz-root";
    rootEl.innerHTML =
      '<div class="vivaci-quiz-overlay" data-quiz-close hidden></div>' +
      '<div class="vivaci-quiz-dialog" role="dialog" aria-modal="true" aria-labelledby="vivaci-quiz-title" tabindex="-1" hidden>' +
      '  <div class="vivaci-quiz-panel">' +
      '    <button type="button" class="vivaci-quiz-close" data-quiz-close aria-label="Stäng">' +
      '      <span class="icon-embed-xsmall w-embed">' +
      lucideX() +
      "</span></button>" +
      '    <div class="vivaci-quiz-panel-inner"></div>' +
      "  </div></div>";
    document.body.appendChild(rootEl);

    rootEl.querySelectorAll("[data-quiz-close]").forEach(function (el) {
      el.addEventListener("click", closeQuiz);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.phase !== "idle") closeQuiz();
    });

    return rootEl;
  }

  function setScrollLock(on) {
    document.documentElement.classList.toggle("vivaci-quiz-open", on);
  }

  function openQuiz(locale) {
    ensureRoot();
    if (modalClosing) return;
    state.locale = locale || DEFAULT_LOCALE;
    state.lastFocus = document.activeElement;

    var dialog = $(".vivaci-quiz-dialog", rootEl);
    var overlay = $(".vivaci-quiz-overlay", rootEl);
    var panel = quizPanel();
    dialog.hidden = false;
    overlay.hidden = false;
    rootEl.classList.add("is-open");
    setScrollLock(true);
    renderLoading();
    animateModalIn(overlay, panel);

    loadQuiz(state.locale)
      .then(function (config) {
        state.config = config;
        resetSession();
        render({ direction: 0 });
        var closeBtn = $(".vivaci-quiz-close", rootEl);
        if (closeBtn) closeBtn.setAttribute("aria-label", ui("close"));
        dialog.focus();
      })
      .catch(function (err) {
        console.warn("[vivaci-quiz]", err);
        renderError();
        animatePanelContentIn(0);
      });
  }

  function closeQuiz() {
    if (!rootEl || modalClosing || state.phase === "idle") return;
    var dialog = $(".vivaci-quiz-dialog", rootEl);
    var overlay = $(".vivaci-quiz-overlay", rootEl);
    var panel = quizPanel();
    modalClosing = true;
    killContentMotion();

    animateModalOut(overlay, panel, function () {
      dialog.hidden = true;
      overlay.hidden = true;
      rootEl.classList.remove("is-open");
      setScrollLock(false);
      state.phase = "idle";
      modalClosing = false;
      if (state.lastFocus && state.lastFocus.focus) {
        state.lastFocus.focus();
      }
    });
  }

  function resetSession() {
    state.answers = {};
    state.stepIndex = 0;
    state.phase = "intro";
  }

  function renderLoading() {
    state.phase = "loading";
    quizPanelInner().innerHTML =
      '<p class="text-size-regular text-style-muted vivaci-quiz-loading">…</p>';
  }

  function renderError() {
    state.phase = "error";
    quizPanelInner().innerHTML =
      '<p class="text-size-regular">Quizet kunde inte laddas. Försök igen senare.</p>';
  }

  function currentQuestion() {
    var qs = visibleQuestions();
    return qs[state.stepIndex] || null;
  }

  function isStepValid(q) {
    if (!q) return false;
    var val = answerFor(q.id);
    if (q.type === "multi") {
      return Array.isArray(val) && val.length > 0;
    }
    return val != null && val !== "";
  }

  function toggleMultiAnswer(questionId, optionId) {
    var current = answerFor(questionId);
    var list = Array.isArray(current) ? current.slice() : [];
    var idx = list.indexOf(optionId);
    if (idx === -1) list.push(optionId);
    else list.splice(idx, 1);
    state.answers[questionId] = list;
  }

  function computeResults() {
    var scores = {};
    var reasons = {};

    state.config.questions.forEach(function (q) {
      if (!showIfMatches(q.showIf)) return;
      var val = answerFor(q.id);
      if (val == null) return;

      var selected = q.type === "multi" ? val : [val];
      q.options.forEach(function (opt) {
        if (selected.indexOf(opt.id) === -1) return;
        var weights = opt.weights || {};
        Object.keys(weights).forEach(function (href) {
          scores[href] = (scores[href] || 0) + weights[href];
          if (opt.reasons && opt.reasons[href]) {
            if (!reasons[href]) reasons[href] = [];
            reasons[href].push(opt.reasons[href]);
          }
        });
      });
    });

    var maxItems =
      (state.config.results && state.config.results.maxItems) || 5;
    var minScore =
      (state.config.results && state.config.results.minScore) || 1;

    var ranked = Object.keys(scores)
      .map(function (href) {
        return {
          href: href,
          score: scores[href],
          reasons: reasons[href] || [],
        };
      })
      .filter(function (r) {
        return r.score >= minScore;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, maxItems);

    return ranked.map(function (r) {
      var meta = state.navByHref[r.href] || {};
      return {
        href: r.href,
        label: meta.label || r.href,
        description: meta.description || "",
        reasons: r.reasons.filter(function (txt, i, arr) {
          return arr.indexOf(txt) === i;
        }),
      };
    });
  }

  function renderIntro() {
    var intro = state.config.intro || {};
    var panel = quizPanelInner();
    panel.innerHTML =
      '<div class="vivaci-quiz-intro">' +
      (intro.eyebrow
        ? '<p class="text-size-small text-style-muted vivaci-quiz-eyebrow">' +
          intro.eyebrow +
          "</p>"
        : "") +
      '<h2 class="heading-style-h4" id="vivaci-quiz-title">' +
      (intro.heading || state.config.meta.title) +
      "</h2>" +
      (intro.body
        ? '<p class="text-size-regular text-style-muted">' + intro.body + "</p>"
        : "") +
      (intro.durationHint
        ? '<p class="text-size-small text-style-muted">' +
          intro.durationHint +
          "</p>"
        : "") +
      '<button type="button" class="button w-inline-block vivaci-quiz-primary" data-quiz-start>' +
      ui("start") +
      '<span class="icon-embed-xsmall w-embed">' +
      lucideChevronRight() +
      "</span></button></div>";

    $("[data-quiz-start]", panel).addEventListener("click", function () {
      state.phase = "questions";
      state.stepIndex = 0;
      render({ direction: 1 });
    });
  }

  function renderQuestion() {
    var q = currentQuestion();
    var qs = visibleQuestions();
    var panel = quizPanelInner();
    if (!q) {
      state.phase = "results";
      render({ direction: 1 });
      return;
    }

    var stepLabel = format(ui("stepOf"), {
      current: state.stepIndex + 1,
      total: qs.length,
    });
    var progress = ((state.stepIndex + 1) / qs.length) * 100;

    var optionsHtml = q.options
      .map(function (opt) {
        var val = answerFor(q.id);
        var checked =
          q.type === "multi"
            ? Array.isArray(val) && val.indexOf(opt.id) !== -1
            : val === opt.id;
        var type = q.type === "multi" ? "checkbox" : "radio";
        var markHtml =
          type === "checkbox"
            ? '<span class="vivaci-quiz-control-mark"><span class="vivaci-quiz-control-icon w-embed">' +
              lucideCheck() +
              "</span></span>"
            : '<span class="vivaci-quiz-control-mark"></span>';
        return (
          '<label class="vivaci-quiz-option' +
          (checked ? " is-selected" : "") +
          '" data-option-type="' +
          type +
          '">' +
          '<input class="vivaci-quiz-option-input" type="' +
          type +
          '" name="q-' +
          q.id +
          '" value="' +
          opt.id +
          '"' +
          (checked ? " checked" : "") +
          ">" +
          '<span class="vivaci-quiz-control" aria-hidden="true">' +
          markHtml +
          "</span>" +
          '<span class="vivaci-quiz-option-body">' +
          '<span class="vivaci-quiz-option-label">' +
          opt.label +
          "</span>" +
          (opt.hint
            ? '<span class="text-size-small text-style-muted">' +
              opt.hint +
              "</span>"
            : "") +
          "</span></label>"
        );
      })
      .join("");

    panel.innerHTML =
      '<div class="vivaci-quiz-step">' +
      '<p class="text-size-small text-style-muted">' +
      stepLabel +
      "</p>" +
      '<div class="vivaci-quiz-progress" aria-hidden="true"><span data-quiz-progress style="width:' +
      progress +
      '%"></span></div>' +
      '<h2 class="heading-style-h5" id="vivaci-quiz-title">' +
      q.prompt +
      "</h2>" +
      (q.subtitle
        ? '<p class="text-size-regular text-style-muted">' + q.subtitle + "</p>"
        : "") +
      '<p class="text-size-small text-style-muted vivaci-quiz-hint">' +
      (q.type === "multi" ? ui("selectMany") : ui("selectOne")) +
      "</p>" +
      '<div class="vivaci-quiz-options" role="' +
      (q.type === "multi" ? "group" : "radiogroup") +
      '" aria-labelledby="vivaci-quiz-title">' +
      optionsHtml +
      "</div>" +
      '<div class="vivaci-quiz-actions">' +
      (state.stepIndex > 0
        ? '<button type="button" class="button is-secondary vivaci-quiz-back" data-quiz-back>' +
          '<span class="icon-embed-xsmall w-embed">' +
          lucideChevronLeft() +
          "</span>" +
          ui("back") +
          "</button>"
        : "<span></span>") +
      '<button type="button" class="button vivaci-quiz-primary" data-quiz-next' +
      (isStepValid(q) ? "" : " disabled") +
      ">" +
      (state.stepIndex === qs.length - 1 ? ui("finish") : ui("next")) +
      '<span class="icon-embed-xsmall w-embed">' +
      lucideChevronRight() +
      "</span></button></div></div>";

    var progressEl = $("[data-quiz-progress]", panel);
    if (progressEl && motionEnabled()) {
      gsap.fromTo(
        progressEl,
        { width: "0%" },
        { width: progress + "%", duration: dur("normal"), ease: ease("out") }
      );
    }

    panel.querySelectorAll(".vivaci-quiz-option-input").forEach(function (input) {
      input.addEventListener("change", function () {
        if (q.type === "multi") {
          toggleMultiAnswer(q.id, input.value);
        } else {
          state.answers[q.id] = input.value;
        }
        updateOptionSelection(panel, q);
      });
    });
    updateOptionSelection(panel, q);

    var back = $("[data-quiz-back]", panel);
    if (back) {
      back.addEventListener("click", function () {
        state.stepIndex -= 1;
        render({ direction: -1 });
      });
    }

    var next = $("[data-quiz-next]", panel);
    if (next) {
      next.addEventListener("click", function () {
        if (!isStepValid(q)) return;
        if (state.stepIndex >= qs.length - 1) {
          state.phase = "results";
          render({ direction: 1 });
          return;
        }
        state.stepIndex += 1;
        render({ direction: 1 });
      });
    }
  }

  function renderResults() {
    var results = computeResults();
    var panel = quizPanelInner();

    var cards =
      results.length === 0
        ? '<p class="text-size-regular text-style-muted">' +
          ui("emptyResults") +
          "</p>"
        : results
            .map(function (item) {
              var why =
                item.reasons.length === 0
                  ? ""
                  : '<div class="vivaci-quiz-why">' +
                    '<p class="text-size-small text-weight-bold">' +
                    ui("whyHeading") +
                    '</p><ul class="vivaci-quiz-why-list">' +
                    item.reasons
                      .slice(0, 3)
                      .map(function (r) {
                        return "<li>" + r + "</li>";
                      })
                      .join("") +
                    "</ul></div>";
              return (
                '<article class="vivaci-quiz-result-card">' +
                '<h3 class="heading-style-h6">' +
                item.label +
                "</h3>" +
                (item.description
                  ? '<p class="text-size-small text-style-muted">' +
                    item.description +
                    "</p>"
                  : "") +
                why +
                '<a href="' +
                item.href +
                '" class="button is-secondary is-small w-inline-block">' +
                ui("readMore") +
                '<span class="icon-embed-xsmall w-embed">' +
                lucideChevronRight() +
                "</span></a></article>"
              );
            })
            .join("");

    panel.innerHTML =
      '<div class="vivaci-quiz-results">' +
      '<h2 class="heading-style-h4" id="vivaci-quiz-title">' +
      ui("resultsTitle") +
      "</h2>" +
      '<p class="text-size-regular text-style-muted">' +
      ui("resultsLead") +
      "</p>" +
      '<div class="vivaci-quiz-result-list">' +
      cards +
      "</div>" +
      '<div class="vivaci-quiz-actions is-results">' +
      '<a href="' +
      ui("consultHref") +
      '" class="button w-inline-block">' +
      ui("consultCta") +
      "</a>" +
      '<button type="button" class="button is-secondary" data-quiz-restart">' +
      ui("restart") +
      "</button></div></div>";

    $("[data-quiz-restart]", panel).addEventListener("click", function () {
      resetSession();
      render({ direction: -1 });
    });

    panel.querySelectorAll(".vivaci-quiz-result-card a").forEach(function (a) {
      a.addEventListener("click", function () {
        closeQuiz();
      });
    });
  }

  function render(options) {
    if (!state.config) return;
    options = options || {};
    var direction = options.direction != null ? options.direction : 0;
    var useSwap =
      options.transition !== false &&
      state.phase !== "loading" &&
      state.phase !== "error";

    function draw() {
      if (state.phase === "intro") renderIntro();
      else if (state.phase === "questions") renderQuestion();
      else if (state.phase === "results") renderResults();
    }

    if (useSwap) {
      swapPanelContent(draw, direction);
    } else {
      draw();
      if (quizPanelInner() && state.phase !== "loading") {
        animatePanelContentIn(direction);
      }
    }
  }

  document.addEventListener(
    "click",
    function (e) {
    var trigger = e.target.closest(triggerSelector);
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    var locale =
      (window.VivaciI18n && window.VivaciI18n.getLocale && window.VivaciI18n.getLocale()) ||
      document.documentElement.getAttribute("data-vivaci-locale") ||
      trigger.getAttribute("data-vivaci-quiz-locale") ||
      DEFAULT_LOCALE;
    if (locale.length > 2) locale = locale.slice(0, 2);
    openQuiz(locale);
    },
    true
  );

  window.VivaciQuiz = {
    open: openQuiz,
    close: closeQuiz,
  };
})();
