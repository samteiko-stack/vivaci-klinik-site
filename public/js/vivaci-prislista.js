/**
 * Prislista page — content/prislista.json (enhances server-rendered rows)
 */
(function () {
  "use strict";

  var DATA_URL = "/content/prislista.json";

  function setText(el, text) {
    if (el && text != null) el.textContent = text;
  }

  function slugify(title) {
    return String(title || "section")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "och")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function announceReady() {
    document.dispatchEvent(new CustomEvent("vivaci:listing-ready"));
  }

  function cloneTemplate(id) {
    var tpl = document.getElementById(id);
    if (!tpl || !tpl.content) return null;
    var node = tpl.content.firstElementChild;
    return node ? node.cloneNode(true) : null;
  }

  function prislistaBasePath() {
    var p = window.location.pathname || "/prislista";
    if (p.endsWith("/prislista.html")) {
      return p.slice(0, -".html".length) || "/prislista";
    }
    if (p === "/prislista" || p.endsWith("/prislista/")) return "/prislista";
    return "/prislista";
  }

  function sectionNavHref(sectionId) {
    return prislistaBasePath() + "#" + sectionId;
  }

  function sectionIdFromLink(link) {
    if (!link) return "";
    var fromData = link.getAttribute("data-vivaci-prislista-section");
    if (fromData) return fromData;
    var href = link.getAttribute("href") || "";
    if (href.charAt(0) === "#") return href.slice(1);
    var hashAt = href.indexOf("#");
    if (hashAt >= 0) return href.slice(hashAt + 1);
    return "";
  }

  function bindNavFilters(root) {
    var navHost = root.querySelector("[data-vivaci-prislista-nav]");
    if (!navHost) return;

    var links = navHost.querySelectorAll(".filters2_category-link");
    var reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setActive(active) {
      links.forEach(function (el) {
        var on = el === active;
        el.classList.toggle("is-active", on);
        el.setAttribute("aria-current", on ? "location" : "false");
      });
    }

    function scrollToSection(sectionId) {
      var section = document.getElementById(sectionId);
      if (!section) return;
      section.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }

    links.forEach(function (link) {
      var sectionId = sectionIdFromLink(link);
      if (!sectionId) return;
      link.setAttribute("data-vivaci-prislista-section", sectionId);
      link.setAttribute("href", sectionNavHref(sectionId));
      link.addEventListener("click", function (e) {
        e.preventDefault();
        scrollToSection(sectionId);
        setActive(link);
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", sectionNavHref(sectionId));
        }
      });
    });

    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var targetId = hash.slice(1);
    links.forEach(function (link) {
      if (link.getAttribute("data-vivaci-prislista-section") === targetId) {
        setActive(link);
        window.requestAnimationFrame(function () {
          scrollToSection(targetId);
        });
      }
    });
  }

  function render(data) {
    var root = document.getElementById("vivaci-prislista");
    if (!root) {
      announceReady();
      return;
    }

    setText(
      document.querySelector('[data-vivaci-field="prislista-title"]'),
      data.title
    );
    setText(
      document.querySelector('[data-vivaci-field="prislista-intro"]'),
      data.intro
    );
    setText(
      document.querySelector('[data-vivaci-field="prislista-disclaimer"]'),
      data.disclaimer
    );

    var host = root.querySelector("[data-vivaci-prislista-sections]");
    if (!host) {
      announceReady();
      return;
    }

    var navHost = root.querySelector("[data-vivaci-prislista-nav]");
    host.innerHTML = "";
    if (navHost) navHost.innerHTML = "";

    (data.sections || []).forEach(function (section) {
      var sectionId = "vivaci-prislista-" + slugify(section.title);
      var block = cloneTemplate("vivaci-prislista-section-tpl");
      if (!block) return;

      block.id = sectionId;
      block.classList.add("vivaci-prislista-section");
      var heading = block.querySelector("[data-vivaci-field='section-title']");
      setText(heading, section.title);
      if (heading) heading.id = sectionId + "-heading";

      var table = block.querySelector(".vivaci-prislista-table");
      if (table && heading) table.setAttribute("aria-labelledby", heading.id);

      var tbody = block.querySelector("[data-vivaci-field='section-rows']");
      if (tbody) {
        tbody.innerHTML = "";
        (section.items || []).forEach(function (item) {
          var row = cloneTemplate("vivaci-prislista-row-tpl");
          if (!row) return;
          var link = row.querySelector("[data-vivaci-field='row-label']");
          if (link) {
            link.textContent = item.label || "";
            if (item.href) link.setAttribute("href", item.href);
          }
          setText(row.querySelector("[data-vivaci-field='row-price']"), item.price);
          tbody.appendChild(row);
        });
      }

      host.appendChild(block);

      if (navHost) {
        var navLink = cloneTemplate("vivaci-prislista-nav-link-tpl");
        if (navLink) {
          navLink.setAttribute("data-vivaci-prislista-section", sectionId);
          navLink.setAttribute("href", sectionNavHref(sectionId));
          navLink.textContent = section.title;
          navHost.appendChild(navLink);
        }
      }
    });

    bindNavFilters(root);
    announceReady();
  }

  function load() {
    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(DATA_URL)
      : fetch(DATA_URL).then(function (res) {
          if (!res.ok) throw new Error("prislista.json " + res.status);
          return res.json();
        });
    return req
      .then(render)
      .catch(function (err) {
        console.warn("[vivaci-prislista]", err);
        var root = document.getElementById("vivaci-prislista");
        if (root) bindNavFilters(root);
        announceReady();
      });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(load);
  } else {
    load();
  }
})();
