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
          navLink.setAttribute("href", "#" + sectionId);
          navLink.textContent = section.title;
          navHost.appendChild(navLink);
        }
      }
    });

    announceReady();
  }

  function load() {
    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(DATA_URL)
      : fetch(DATA_URL).then(function (res) {
          if (!res.ok) throw new Error("prislista.json " + res.status);
          return res.json();
        });
    return req.then(render).catch(function (err) {
      console.warn("[vivaci-prislista]", err);
      announceReady();
    });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(load);
  } else {
    load();
  }
})();
