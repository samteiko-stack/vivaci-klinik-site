/**
 * Course enrollment modal — same shell as vivaci-quiz (overlay + panel).
 * Triggers: [data-vivaci-course-enroll]
 */
(function () {
  if (window.__vivaciCourseEnrollLoaded) return;
  window.__vivaciCourseEnrollLoaded = true;

  var ROOT_ID = "vivaci-enroll-root";

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function lucideX() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
    );
  }

  function lucideCalendar() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>'
    );
  }

  function lucideSend() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>'
    );
  }

  function lucideCheckCircle() {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'
    );
  }

  function sessionSummary(dateLabel, time) {
    var parts = [];
    if (dateLabel) parts.push(dateLabel);
    if (time) parts.push(time);
    return parts.join(" · ");
  }

  function motion() {
    return typeof VivaciMotion !== "undefined" ? VivaciMotion : null;
  }

  function animateIn(overlay, panel) {
    if (typeof gsap === "undefined") {
      overlay.style.opacity = "1";
      panel.style.opacity = "1";
      panel.style.transform = "none";
      return;
    }
    gsap.killTweensOf([overlay, panel]);
    gsap.set(overlay, { opacity: 0 });
    gsap.set(panel, { opacity: 0, y: 20, scale: 0.98 });
    gsap.to(overlay, { opacity: 1, duration: 0.36, ease: "power2.out" });
    gsap.to(panel, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.36,
      ease: "power3.out",
      clearProps: "transform",
    });
  }

  function animateOut(overlay, panel, done) {
    if (typeof gsap === "undefined") {
      done();
      return;
    }
    gsap.to(panel, { opacity: 0, y: 12, duration: 0.24, ease: "power2.in" });
    gsap.to(overlay, { opacity: 0, duration: 0.24, ease: "power2.in", onComplete: done });
  }

  var rootEl = null;
  var lastFocus = null;
  var closing = false;

  function ensureRoot() {
    if (rootEl) return rootEl;
    rootEl = document.createElement("div");
    rootEl.id = ROOT_ID;
    rootEl.className = "vivaci-quiz-root";
    rootEl.innerHTML =
      '<div class="vivaci-quiz-overlay" data-enroll-close hidden></div>' +
      '<div class="vivaci-quiz-dialog" role="dialog" aria-modal="true" aria-labelledby="vivaci-enroll-title" tabindex="-1" hidden>' +
      '  <div class="vivaci-quiz-panel vivaci-enroll-panel">' +
      '    <button type="button" class="vivaci-quiz-close" data-enroll-close aria-label="Stäng">' +
      '      <span class="icon-embed-xsmall w-embed">' +
      lucideX() +
      "</span></button>" +
      '    <div class="vivaci-quiz-panel-inner" data-enroll-body></div>' +
      "  </div></div>";
    document.body.appendChild(rootEl);
    rootEl.querySelectorAll("[data-enroll-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && rootEl && rootEl.classList.contains("is-open")) closeModal();
    });
    return rootEl;
  }

  function courseMeta() {
    var html = document.documentElement;
    return {
      title:
        html.getAttribute("data-vivaci-course-title") ||
        ($('[data-vivaci-field="hero-title"]') &&
          $('[data-vivaci-field="hero-title"]').textContent) ||
        "Utbildning",
      slug: html.getAttribute("data-vivaci-course-hydrated") || "",
    };
  }

  function sessionBlock(dateLabel, time) {
    var summary = sessionSummary(dateLabel, time);
    if (!summary) {
      return (
        field("preferredDate", "Önskat kursdatum (t.ex. 14 mar 2026)", "text", false) +
        '<p class="text-size-small text-style-muted vivaci-enroll-hint">' +
        "Tips: klicka Anmäl nu på ett datum i listan så fylls tillfället i automatiskt." +
        "</p>"
      );
    }
    return (
      '<div class="vivaci-enroll-session">' +
      '<span class="vivaci-enroll-session-icon icon-embed-xsmall w-embed">' +
      lucideCalendar() +
      "</span>" +
      '<div class="vivaci-enroll-session-copy">' +
      '<p class="text-size-small text-style-muted vivaci-enroll-session-eyebrow">Valt tillfälle</p>' +
      '<p class="text-size-regular vivaci-enroll-session-value">' +
      escapeHtml(summary) +
      "</p>" +
      "</div></div>" +
      '<input type="hidden" name="preferredSession" value="' +
      escapeAttr(summary) +
      '">'
    );
  }

  function formHtml(opts) {
    var meta = courseMeta();
    var dateLabel = opts.dateLabel || "";
    var time = opts.time || "";
    return (
      '<div class="vivaci-quiz-step vivaci-enroll-form">' +
      '<div class="vivaci-enroll-header">' +
      '<p class="text-size-small text-style-muted vivaci-quiz-eyebrow">Vivaci Academy</p>' +
      '<h2 class="heading-style-h4" id="vivaci-enroll-title">Anmäl dig</h2>' +
      '<p class="text-size-medium vivaci-enroll-course">' +
      escapeHtml(meta.title) +
      "</p></div>" +
      '<form class="vivaci-modal-form" data-enroll-form novalidate>' +
      '<input type="hidden" name="course" value="' +
      escapeAttr(meta.title) +
      '">' +
      '<input type="hidden" name="courseSlug" value="' +
      escapeAttr(meta.slug) +
      '">' +
      sessionBlock(dateLabel, time) +
      '<div class="vivaci-enroll-fields">' +
      '<div class="form_field-2col">' +
      field("firstName", "Förnamn", "text", true) +
      field("lastName", "Efternamn", "text", true) +
      "</div>" +
      field("email", "namn@exempel.se", "email", true) +
      field("phone", "070-123 45 67", "tel", true) +
      field("organisation", "Organisation / klinik", "text", true) +
      selectRole() +
      '<div class="form_field-wrapper">' +
      '<textarea class="form_input is-text-area w-input" id="enroll-message" name="message" rows="2" placeholder="Meddelande (valfritt)" aria-label="Meddelande"></textarea>' +
      "</div></div>" +
      '<div class="vivaci-quiz-actions vivaci-enroll-actions">' +
      '<button type="submit" class="button w-inline-block vivaci-quiz-primary">' +
      "Skicka anmälan" +
      '<span class="icon-embed-xsmall w-embed">' +
      lucideSend() +
      "</span></button></div>" +
      "</form></div>"
    );
  }

  function successHtml() {
    return (
      '<div class="vivaci-quiz-step vivaci-enroll-success">' +
      '<span class="vivaci-enroll-success-icon icon-embed-small w-embed">' +
      lucideCheckCircle() +
      "</span>" +
      '<h2 class="heading-style-h4">Tack för din anmälan</h2>' +
      '<p class="text-size-regular text-style-muted">Vi har tagit emot uppgifterna och återkommer inom två arbetsdagar med nästa steg.</p>' +
      '<button type="button" class="button is-secondary w-button" data-enroll-close>Stäng</button>' +
      "</div>"
    );
  }

  function escapeAttr(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function escapeHtml(s) {
    return escapeAttr(s);
  }

  function field(name, placeholder, type, required, value) {
    var req = required ? ' required=""' : "";
    var val = value ? ' value="' + escapeAttr(value) + '"' : "";
    var aria = escapeAttr(placeholder);
    return (
      '<div class="form_field-wrapper">' +
      '<input class="form_input w-input" id="enroll-' +
      name +
      '" name="' +
      name +
      '" type="' +
      type +
      '" placeholder="' +
      escapeAttr(placeholder) +
      '" aria-label="' +
      aria +
      '"' +
      req +
      val +
      "></div>"
    );
  }

  function selectRole() {
    return (
      '<div class="form_field-wrapper">' +
      '<select class="form_input is-select-input w-select" id="enroll-role" name="role" required="" aria-label="Yrkesroll">' +
      '<option value="" disabled selected hidden>Yrkesroll</option>' +
      "<option>Läkare</option>" +
      "<option>Tandläkare</option>" +
      "<option>Sjuksköterska</option>" +
      "<option>Hudterapeut (medicinsk miljö)</option>" +
      "<option>Klinikchef / admin</option>" +
      "<option>Annat</option>" +
      "</select></div>"
    );
  }

  function openModal(opts) {
    ensureRoot();
    if (closing) return;
    lastFocus = document.activeElement;
    var dialog = $(".vivaci-quiz-dialog", rootEl);
    var overlay = $(".vivaci-quiz-overlay", rootEl);
    var panel = $(".vivaci-quiz-panel", rootEl);
    var body = $("[data-enroll-body]", rootEl);
    body.innerHTML = formHtml(opts || {});
    dialog.hidden = false;
    overlay.hidden = false;
    rootEl.classList.add("is-open");
    document.documentElement.classList.add("vivaci-quiz-open");
    animateIn(overlay, panel);
    dialog.focus();

    var form = body.querySelector("[data-enroll-form]");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        body.innerHTML = successHtml();
        body.querySelectorAll("[data-enroll-close]").forEach(function (btn) {
          btn.addEventListener("click", closeModal);
        });
      });
    }
  }

  function closeModal() {
    if (!rootEl || closing) return;
    closing = true;
    var dialog = $(".vivaci-quiz-dialog", rootEl);
    var overlay = $(".vivaci-quiz-overlay", rootEl);
    var panel = $(".vivaci-quiz-panel", rootEl);
    animateOut(overlay, panel, function () {
      dialog.hidden = true;
      overlay.hidden = true;
      rootEl.classList.remove("is-open");
      document.documentElement.classList.remove("vivaci-quiz-open");
      closing = false;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
  }

  function scrollToCourseDates() {
    var target =
      document.getElementById("vivaci-course-dates") ||
      document.querySelector('[data-vivaci-field="dates-list"]');
    if (!target) return;
    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
  }

  document.addEventListener("click", function (e) {
    var scrollTrigger = e.target.closest("[data-vivaci-course-scroll-dates]");
    if (scrollTrigger) {
      e.preventDefault();
      scrollToCourseDates();
      return;
    }

    var trigger = e.target.closest("[data-vivaci-course-enroll]");
    if (!trigger) return;
    e.preventDefault();

    var dateLabel = trigger.getAttribute("data-course-date") || "";
    var time = trigger.getAttribute("data-course-time") || "";
    if (!dateLabel && !time) {
      scrollToCourseDates();
      return;
    }

    openModal({ dateLabel: dateLabel, time: time });
  });

  window.VivaciCourseEnroll = {
    open: openModal,
    close: closeModal,
    scrollToDates: scrollToCourseDates,
  };
})();
