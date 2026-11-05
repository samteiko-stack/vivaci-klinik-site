/**
 * Site footer from content/from-production/footer.json (Railway production).
 */
(function () {
  if (window.__vivaciFooterLoaded) return;
  window.__vivaciFooterLoaded = true;

  var DATA_URL = "/content/from-production/footer.json";

  function fetchContent(path) {
    if (window.VivaciI18n && window.VivaciI18n.fetchContent) {
      return window.VivaciI18n.fetchContent(path);
    }
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error(path + " " + res.status);
      return res.json();
    });
  }

  function contactTitle() {
    return window.VivaciI18n
      ? window.VivaciI18n.t("footer.contact", null, "Kontakt")
      : "Kontakt";
  }

  var LUCIDE_SVG_OPEN =
    'xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet" aria-hidden="true" role="img"';

  function lucideIcon(name, inner) {
    return (
      "<svg " +
      LUCIDE_SVG_OPEN +
      ' class="lucide lucide-' +
      name +
      '">' +
      inner +
      "</svg>"
    );
  }

  var FOOTER_CONTACT_ICONS = {
    address: lucideIcon(
      "map-pin",
      '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'
    ),
    phone: lucideIcon(
      "phone",
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'
    ),
    email: lucideIcon(
      "mail",
      '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>'
    ),
  };

  function setContactRowIcon(row, kind) {
    if (!row || !FOOTER_CONTACT_ICONS[kind]) return;
    var embed = row.querySelector(".icon-embed-xsmall.w-embed");
    if (embed) embed.innerHTML = FOOTER_CONTACT_ICONS[kind];
  }

  function setLink(a, item) {
    if (!a || !item) return;
    a.href = item.href || "#";
    a.textContent = item.label || "";
  }

  function applyContact(accordion, contact) {
    if (!accordion || !contact) return;
    var titleEl = accordion.querySelector(".faq1_question .text-weight-bold");
    if (titleEl) titleEl.textContent = contactTitle();

    var links = accordion.querySelectorAll(".footer5_link");
    if (contact.address && links[0]) {
      var addr = contact.address;
      links[0].href = addr.href || "#";
      var addrText = String(addr.label || "");
      if (addrText.indexOf("<br") === -1) {
        addrText = addrText.replace(/,\s*Plan 2/, ",<br>Plan 2");
      }
      links[0].innerHTML = addrText;
    }
    if (contact.phone && links[1]) setLink(links[1], contact.phone);
    if (contact.email && links[2]) setLink(links[2], contact.email);

    var rows = accordion.querySelectorAll(".footer-left-link-wrap");
    setContactRowIcon(rows[0], "address");
    setContactRowIcon(rows[1], "phone");
    setContactRowIcon(rows[2], "email");

    var wrap = accordion.querySelector(".footer-links-wrap");
    if (wrap) {
      wrap.querySelectorAll("[data-vivaci-footer-social]").forEach(function (el) {
        el.remove();
      });
    }
  }

  function applyLinkColumn(accordion, column) {
    if (!accordion || !column || !column.links) return;
    accordion.hidden = false;
    var titleEl = accordion.querySelector(".faq1_question .text-weight-bold");
    if (titleEl && column.title) titleEl.textContent = column.title;

    var wrap = accordion.querySelector(".footer-links-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    column.links.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "footer5_link";
      a.href = item.href || "#";
      a.textContent = item.label || "";
      wrap.appendChild(a);
    });
  }

  function applyNewsletter(block, data) {
    if (!block || !data) return;
    var sectionLabel = block.querySelector(".text-weight-semibold");
    var lines = block.querySelectorAll(".text-size-small");
    var input = block.querySelector(".form_input");
    var submit = block.querySelector('input[type="submit"], button[type="submit"]');
    if (sectionLabel && data.sectionTitle) {
      sectionLabel.textContent = data.sectionTitle;
    }
    block.querySelectorAll("[data-vivaci-footer-newsletter-subtitle]").forEach(function (el) {
      var row = el.closest(".margin-bottom");
      if (row) row.remove();
      else el.remove();
    });
    if (data.description && lines[0]) {
      lines[0].textContent = data.description;
    }
    if (input && data.placeholder) input.placeholder = data.placeholder;
    if (submit && data.submitLabel) {
      if (submit.tagName === "INPUT") submit.value = data.submitLabel;
      else submit.textContent = data.submitLabel;
    }
  }

  function applyLegal(footer, legal, copyright) {
    if (copyright) {
      var credit = footer.querySelector(".footer5_credit-text");
      if (credit) {
        var peia = credit.querySelector("a.xtra, a[href*='peia']");
        credit.textContent = "";
        credit.appendChild(document.createTextNode(copyright + " "));
        if (peia) credit.appendChild(peia);
      }
    }
    if (!legal || !legal.length) return;
    var list = footer.querySelector(".logo4_list");
    if (!list) return;
    list.innerHTML = "";
    legal.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "footer5_legal-link";
      a.href = item.href || "#";
      a.textContent = item.label || "";
      list.appendChild(a);
    });
  }

  function applyFooter(root, data) {
    if (!root || !data) return;

    var accordions = Array.prototype.slice.call(
      root.querySelectorAll(".footer5_top-wrapper-3 .faq1_accordion")
    );
    if (accordions.length && data.contact) {
      applyContact(accordions[0], data.contact);
    }

    var linkAccordions = accordions.slice(1);
    var columns = data.linkColumns || [];
    columns.forEach(function (col, i) {
      applyLinkColumn(linkAccordions[i], col);
    });
    for (var j = columns.length; j < linkAccordions.length; j++) {
      linkAccordions[j].hidden = true;
    }

    applyNewsletter(root.querySelector(".footer2_right-wrapper"), data.newsletter);
    applyLegal(root, data.legal, data.copyright);
  }

  function hydrate() {
    return fetchContent(DATA_URL)
      .then(function (data) {
        document.querySelectorAll("footer.is-section.bg-dark").forEach(function (el) {
          applyFooter(el, data);
        });
        return data;
      })
      .catch(function (err) {
        console.warn("[vivaci] footer:", err);
      });
  }

  function scheduleHydrate() {
    var wait =
      window.VivaciI18n && window.VivaciI18n.whenReady
        ? window.VivaciI18n.whenReady()
        : window.__vivaciI18nReady;
    window.__vivaciFooterReady =
      wait && wait.then ? wait.then(hydrate) : hydrate();
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
