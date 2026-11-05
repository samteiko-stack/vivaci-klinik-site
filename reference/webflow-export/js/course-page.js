/**
 * Hydrates course-page.html from embedded JSON or /content/utbildning/{slug}.json
 */
(function () {
  if (document.documentElement.getAttribute("data-vivaci-course-hydrated")) {
    return;
  }
  var match = window.location.pathname.match(/^\/utbildning\/([^/]+)\/?$/);
  if (!match) return;

  var slug = match[1];
  var url = "/content/utbildning/" + slug + ".json";

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function setText(el, text) {
    if (!el || text == null) return;
    el.textContent = text;
  }

  function setMeta(name, content) {
    if (!content) return;
    var el = document.querySelector('meta[name="' + name + '"]');
    if (el) el.setAttribute("content", content);
    var og = document.querySelector('meta[property="og:' + name + '"]');
    if (og) og.setAttribute("content", content);
  }

  function cloneFromTemplate(parent, selector, eachFn) {
    var template = parent.querySelector(selector);
    if (!template) return;
    var html = template.outerHTML;
    parent.innerHTML = "";
    eachFn(function () {
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      return wrap.firstElementChild;
    }, parent);
  }

  function fillDates(listEl, dates) {
    if (!listEl || !dates || !dates.length) return;
    cloneFromTemplate(listEl, ".career21_item", function (mk) {
      dates.forEach(function (d) {
        var node = mk();
        setText(
          node.querySelector(".career21_title-wrapper .heading-style-h6"),
          d.label || ""
        );
        var details = node.querySelectorAll(".career21_job-detail div:last-child");
        if (details[0]) setText(details[0], d.time || "");
        if (details[1]) setText(details[1], d.seats || "");
        var btn = node.querySelector(".button-group a");
        if (btn) {
          btn.className = "is-vivaci-enroll-trigger";
          btn.setAttribute("href", "#");
          btn.setAttribute("data-vivaci-course-enroll", "");
          if (d.label) btn.setAttribute("data-course-date", d.label);
          if (d.time) btn.setAttribute("data-course-time", d.time);
        }
        listEl.appendChild(node);
      });
    });
  }

  function fillInstructors(grid, items) {
    if (!grid || !items || !items.length) return;
    cloneFromTemplate(grid, ".team8_item", function (mk) {
      items.forEach(function (person, i) {
        var node = mk();
        if (i % 2 === 1) node.classList.add("is-down");
        else node.classList.remove("is-down");
        var img = node.querySelector(".team8_image");
        if (img && person.image) {
          img.src = person.image;
          img.alt = person.name ? person.name + " — instruktör" : "";
          img.removeAttribute("srcset");
          img.removeAttribute("sizes");
        }
        setText(
          node.querySelector(".team8_title-wrapper .text-size-regular"),
          person.name || ""
        );
        setText(
          node.querySelector(".team8_title-wrapper .text-size-small"),
          person.role || ""
        );
        grid.appendChild(node);
      });
    });
  }

  function fillFaqs(listEl, faqs) {
    if (!listEl || !faqs || !faqs.length) return;
    var template = listEl.querySelector(".faq3_accordion");
    if (!template) return;
    var html = template.outerHTML;
    var parent = template.parentElement;
    parent.innerHTML = "";
    faqs.forEach(function (faq) {
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      var node = wrap.firstElementChild;
      var q = node.querySelector(".faq3_question .heading-style-h6");
      var a = node.querySelector(".faq3_answer p");
      if (q) setText(q, faq.question);
      if (a) setText(a, faq.answer);
      parent.appendChild(node);
    });
  }

  function applyData(data) {
    if (!data) return;

    document.documentElement.setAttribute("data-vivaci-course-loaded", slug);

    if (data.title) {
      document.title = data.title + " — Vivaci Klinik";
      setMeta("description", data.metaDescription || (data.hero && data.hero.intro));
      setMeta("title", data.title + " — Vivaci Klinik");
    }

    var hero = data.hero || {};
    setText($('[data-vivaci-field="hero-title"]'), hero.title || data.title);
    setText($('[data-vivaci-field="hero-intro"]'), hero.intro || "");
    setText($('[data-vivaci-field="hero-audience"]'), hero.audience || "");

    var heroImg = $("[data-vivaci-hero-image]");
    if (heroImg && hero.image) {
      heroImg.src = hero.image;
      heroImg.alt = hero.title || data.title || "Utbildning";
      heroImg.removeAttribute("srcset");
      heroImg.removeAttribute("sizes");
    }

    var ctaPrimary = $('[data-vivaci-field="hero-cta-primary"]');
    if (ctaPrimary && hero.ctaPrimary) {
      ctaPrimary.className = "is-vivaci-enroll-trigger";
      ctaPrimary.setAttribute("href", "#");
      ctaPrimary.setAttribute("data-vivaci-course-enroll", "");
      var ctaLabel = ctaPrimary.querySelector("div");
      if (ctaLabel && hero.ctaPrimary.label) setText(ctaLabel, hero.ctaPrimary.label);
    }

    var summary = data.summary || {};
    setText($('[data-vivaci-field="summary-intro"]'), summary.intro || "");
    setText($('[data-vivaci-field="fee-amount"]'), summary.fee || "");
    setText($('[data-vivaci-field="fee-suffix"]'), summary.feeNote || "");
    setText($('[data-vivaci-field="course-level"]'), summary.level || "");
    setText($('[data-vivaci-field="course-duration"]'), summary.duration || "");
    setText($('[data-vivaci-field="course-location"]'), summary.location || "");

    fillDates($('[data-vivaci-field="dates-list"]'), data.dates);

    var aboutBody = $('[data-vivaci-field="about-body"]');
    if (aboutBody && data.about && data.about.html) {
      aboutBody.innerHTML = data.about.html;
    }

    var instructors = data.instructors;
    var instrSec = $('[data-vivaci-section="instructors"]');
    if (instrSec) {
      var showInstr =
        !!(instructors && instructors.enabled !== false && instructors.items && instructors.items.length);
      instrSec.hidden = !showInstr;
      if (showInstr) {
        setText(
          $('[data-vivaci-field="instructors-heading"]', instrSec),
          instructors.heading || "Instruktörer"
        );
        setText($('[data-vivaci-field="instructors-intro"]', instrSec), instructors.intro || "");
        fillInstructors($(".team8_list", instrSec), instructors.items);
      }
    }

    var faq = data.faq;
    var faqSec = $('[data-vivaci-section="faq"]');
    if (faqSec) {
      var showFaq = !!(faq && faq.enabled !== false && faq.items && faq.items.length);
      faqSec.hidden = !showFaq;
      if (showFaq) {
        setText($('[data-vivaci-field="faq-intro"]', faqSec), faq.intro || "");
        var faqList = $(".faq3_list", faqSec);
        fillFaqs(faqList, faq.items);
        if (window.VivaciFaqAccordion && faqList) {
          window.VivaciFaqAccordion.refresh(faqList);
        }
      }
    }
  }

  function readEmbedded() {
    var el = document.getElementById("vivaci-course-data");
    if (!el || !el.textContent) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.warn("[vivaci-course-page] embedded JSON invalid", e);
      return null;
    }
  }

  var embedded = readEmbedded();
  if (embedded) {
    applyData(embedded);
    return;
  }

  function loadCourse() {
    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(url)
      : fetch(url).then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        });
    req.then(applyData).catch(function (err) {
      console.warn("[vivaci-course-page]", url, err);
    });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(loadCourse);
  } else {
    loadCourse();
  }
})();
