/**
 * Site footer from content/from-production/footer.json (Railway production).
 */
(function () {
  if (window.__vivaciFooterLoaded) return;
  window.__vivaciFooterLoaded = true;

  var DATA_URL = "/content/from-production/footer.json";

  var FALLBACK_FOOTER = {
    linkColumns: [
      {
        title: "Utforska",
        links: [
          { label: "Före & Efter", href: "/behandlingar/hydrafacial#results" },
          {
            label: "Patientrecensioner",
            href: "https://www.bokadirekt.se/places/vivaci-klinik-51774",
          },
          { label: "Varumärken", href: "/#vivaci-home-brands" },
          { label: "Vanliga frågor", href: "/#vivaci-home-faq" },
          { label: "Nyheter & tips", href: "/blogg" },
          { label: "Betalningsalternativ", href: "/#vivaci-faq-betalning" },
        ],
      },
      {
        title: "Om Vivaci",
        links: [
          { label: "Om oss", href: "/om-oss" },
          { label: "Möt våra experter", href: "/om-oss#vivaci-om-team" },
          { label: "Vår metod", href: "/om-oss#vivaci-om-method" },
          { label: "Varför Vivaci", href: "/om-oss#vivaci-om-values" },
          { label: "Patientsäkerhet", href: "/om-oss#vivaci-om-values" },
          { label: "Karriär", href: "/kontakt" },
        ],
      },
    ],
    legal: [
      { label: "Integritetspolicy", href: "/integritetspolicy" },
      { label: "Allmänna villkor", href: "/villkor" },
      { label: "Avbokning & återbetalning", href: "/avbokning" },
      { label: "Cookieinställningar", href: "/cookies" },
      { label: "Innehållsadmin", href: "/content-admin" },
    ],
    copyright: "© 2026 Vivaci Klinik. Alla rättigheter förbehållna.",
  };

  function localizedHref(href) {
    if (!href || !window.VivaciLocaleRouting || !window.VivaciLocaleRouting.localizeHref) {
      return href;
    }
    var locale =
      window.VivaciLocaleRouting.localeFromPathname &&
      window.VivaciLocaleRouting.localeFromPathname();
    return window.VivaciLocaleRouting.localizeHref(href, locale);
  }

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

  var FOOTER_SOCIAL_ICONS = {
    facebook: lucideIcon(
      "facebook",
      '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'
    ),
    instagram: lucideIcon(
      "instagram",
      '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>'
    ),
    tiktok: lucideIcon(
      "tiktok",
      '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>'
    ),
  };

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
    a.href = localizedHref(item.href || "#");
    a.textContent = item.label || "";
  }

  function applyContact(accordion, contact) {
    if (!accordion || !contact) return;
    var titleEl = accordion.querySelector(".faq1_question .text-weight-bold");
    if (titleEl) titleEl.textContent = contactTitle();

    var links = accordion.querySelectorAll(".footer5_link");
    if (contact.address && links[0]) {
      var addr = contact.address;
      links[0].href = localizedHref(addr.href || "#");
      var addrText = String(addr.label || "");
      if (addrText.indexOf("<br") === -1) {
        addrText = addrText
          .replace(/,\s*Plan 2[,\s]+/, ", Plan 2,<br>")
          .replace(/,\s*Plan 2$/, ", Plan 2");
      }
      links[0].innerHTML = addrText;
    }
    if (contact.phone && links[1]) setLink(links[1], contact.phone);
    if (contact.email && links[2]) setLink(links[2], contact.email);

    var rows = accordion.querySelectorAll(".footer-left-link-wrap");
    setContactRowIcon(rows[0], "address");
    setContactRowIcon(rows[1], "phone");
    setContactRowIcon(rows[2], "email");

    if (contact.social && contact.social.length) {
      applySocial(accordion, contact.social);
    }
  }

  function applySocial(accordion, social) {
    if (!accordion || !social || !social.length) return;
    var answer = accordion.querySelector(".faq1_answer");
    if (!answer) return;
    answer.querySelectorAll("[data-vivaci-footer-social]").forEach(function (el) {
      el.remove();
    });

    var list = document.createElement("div");
    list.className = "vivaci-footer-social";
    list.setAttribute("data-vivaci-footer-social", "");

    social.forEach(function (item) {
      if (!item || !item.href) return;
      var a = document.createElement("a");
      a.className = "vivaci-footer-social__link w-inline-block";
      a.href = localizedHref(item.href);
      a.setAttribute("aria-label", item.label || item.network || "Social");
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      var embed = document.createElement("div");
      embed.className = "icon-embed-xsmall w-embed";
      var net = (item.network || "").toLowerCase();
      embed.innerHTML = FOOTER_SOCIAL_ICONS[net] || "";
      a.appendChild(embed);
      list.appendChild(a);
    });

    if (list.childNodes.length) {
      answer.appendChild(list);
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
      var href = item.href || "#";
      a.href = localizedHref(href);
      a.textContent = item.label || "";
      if (/^https?:\/\//i.test(href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
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
    var subtitle = block.querySelector("[data-vivaci-footer-newsletter-subtitle]");
    if (data.title) {
      if (!subtitle) {
        var subWrap = document.createElement("div");
        subWrap.className = "margin-bottom margin-xsmall";
        subtitle = document.createElement("p");
        subtitle.className = "vivaci-footer-newsletter-title";
        subtitle.setAttribute("data-vivaci-footer-newsletter-subtitle", "");
        subWrap.appendChild(subtitle);
        var sectionWrap = block.querySelector(
          ":scope > .margin-bottom.margin-xsmall"
        );
        if (sectionWrap) {
          sectionWrap.insertAdjacentElement("afterend", subWrap);
        } else {
          block.insertBefore(subWrap, block.firstChild);
        }
      }
      subtitle.textContent = data.title;
    } else if (subtitle) {
      var subRow = subtitle.closest(".margin-bottom");
      if (subRow) subRow.remove();
    }
    if (data.description && lines[0]) {
      lines[0].textContent = data.description;
    }
    if (input && data.placeholder) input.placeholder = data.placeholder;
    if (submit && data.submitLabel) {
      if (submit.tagName === "INPUT") submit.value = data.submitLabel;
      else submit.textContent = data.submitLabel;
    }
  }

  function restructureFooterLayout(root) {
    if (!root || root.getAttribute("data-vivaci-footer-split") === "1") {
      return;
    }
    var container = root.querySelector(".container-large");
    if (!container) return;

    var outer = container.querySelector(":scope > .padding-section-large");
    if (!outer) return;

    var paddingBottom = outer.querySelector(":scope > .padding-bottom");
    var legal = outer.querySelector(":scope > .footer5_bottom-wrapper");
    if (!paddingBottom || !legal) return;

    var dividerWrap = paddingBottom.querySelector(
      ":scope > .padding-vertical.padding-xlarge:last-child"
    );

    var main = document.createElement("div");
    main.className = "padding-section-large vivaci-footer-main";

    Array.prototype.forEach.call(paddingBottom.children, function (child) {
      if (child === dividerWrap) return;
      main.appendChild(child);
    });

    var dividerBand = document.createElement("div");
    dividerBand.className = "vivaci-footer-divider";
    dividerBand.setAttribute("data-vivaci-footer-divider", "");
    var line = dividerWrap && dividerWrap.querySelector(".line-divider");
    if (line) {
      dividerBand.appendChild(line.cloneNode(true));
    } else {
      var fallback = document.createElement("div");
      fallback.className = "line-divider text-style-muted is-white";
      dividerBand.appendChild(fallback);
    }

    var legalWrap = document.createElement("div");
    legalWrap.className = "padding-section-large vivaci-footer-legal";
    legalWrap.appendChild(legal);

    paddingBottom.remove();
    outer.replaceWith(main);
    container.appendChild(dividerBand);
    container.appendChild(legalWrap);

    root.setAttribute("data-vivaci-footer-split", "1");
  }

  function flattenFooterAccordions(root) {
    if (!root) return;
    var grid = root.querySelector(".footer5_top-wrapper-3");
    if (!grid) return;

    grid.querySelectorAll(".faq1_accordion").forEach(function (accordion) {
      var question = accordion.querySelector(".faq1_question");
      var answer = accordion.querySelector(".faq1_answer");
      if (question) {
        question.removeAttribute("data-w-id");
      }
      if (answer) {
        answer.style.height = "auto";
        answer.style.maxHeight = "none";
        answer.style.overflow = "visible";
        answer.style.display = "block";
        try {
          if (typeof gsap !== "undefined") {
            gsap.killTweensOf(answer);
            gsap.set(answer, {
              height: "auto",
              overflow: "visible",
              clearProps: "maxHeight",
            });
          }
        } catch (_) {}
      }
      accordion.classList.add("is-vivaci-footer-static");
    });
  }

  function relocateFooterLogo(root) {
    var topRow = root.querySelector(".top-row");
    if (!topRow || topRow.getAttribute("data-vivaci-footer-logo-moved") === "1") {
      return;
    }
    var logoImg = topRow.querySelector(".footer-logo_main");
    var contactCol = root.querySelector(
      ".footer5_top-wrapper-3 > .faq1_accordion"
    );
    if (!logoImg || !contactCol) return;

    var brand = document.createElement("div");
    brand.className = "vivaci-footer-brand";
    brand.setAttribute("data-vivaci-footer-brand", "");
    var link = document.createElement("a");
    link.href = localizedHref("/");
    link.className = "vivaci-footer-brand__link w-inline-block";
    link.setAttribute("aria-label", "Vivaci");
    link.appendChild(logoImg);
    brand.appendChild(link);
    contactCol.insertBefore(brand, contactCol.firstChild);

    topRow.setAttribute("data-vivaci-footer-logo-moved", "1");
    topRow.hidden = true;
    var next = topRow.nextElementSibling;
    if (
      next &&
      next.classList.contains("padding-vertical") &&
      next.classList.contains("padding-xlarge")
    ) {
      next.hidden = true;
    }
  }

  function initFooterLogoLayout() {
    document.querySelectorAll("footer.is-section.bg-dark").forEach(function (el) {
      restructureFooterLayout(el);
      relocateFooterLogo(el);
      flattenFooterAccordions(el);
    });
  }

  function applyLegal(footer, legal, copyright) {
    if (copyright) {
      var credit = footer.querySelector(".footer5_credit-text");
      if (credit) {
        credit.textContent = copyright;
      }
    }
    if (!legal || !legal.length) return;
    var list = footer.querySelector(".logo4_list");
    if (!list) return;
    list.innerHTML = "";
    legal.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "footer5_legal-link";
      a.href = localizedHref(item.href || "#");
      a.textContent = item.label || "";
      list.appendChild(a);
    });
  }

  function applyFooter(root, data) {
    if (!root || !data) return;

    restructureFooterLayout(root);
    relocateFooterLogo(root);
    flattenFooterAccordions(root);

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

  function applyFooterAll(data) {
    document.querySelectorAll("footer.is-section.bg-dark").forEach(function (el) {
      applyFooter(el, data);
    });
  }

  function hydrate() {
    applyFooterAll(FALLBACK_FOOTER);
    return fetchContent(DATA_URL)
      .then(function (data) {
        applyFooterAll(data);
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

  initFooterLogoLayout();
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
