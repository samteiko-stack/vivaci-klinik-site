/**
 * Client hydrate for /nyheter/{slug} when served from blog-page.html template.
 */
(function () {
  "use strict";

  var path = window.location.pathname.replace(/\/$/, "");
  var match = path.match(/^\/nyheter\/([^/]+)$/);
  if (!match) {
    return;
  }
  var slug = decodeURIComponent(match[1]);

  initShareButtons();

  function loadPost() {
    var postUrl = "/content/nyheter/" + encodeURIComponent(slug) + ".json";
    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(postUrl)
      : fetch(postUrl).then(function (res) {
          if (!res.ok) {
            throw new Error("post not found");
          }
          return res.json();
        });
    return req
      .then(function (data) {
        applyPost(data, slug);
      })
      .catch(function () {
        /* prebuilt HTML or 404 */
      });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(loadPost);
  } else {
    loadPost();
  }

  function setText(sel, text) {
    var el = document.querySelector(sel);
    if (el && text != null) {
      el.textContent = text;
    }
  }

  function setHtml(sel, html) {
    var el = document.querySelector(sel);
    if (el && html) {
      el.innerHTML = html;
    }
  }

  function applyPost(data, slug) {
    if (document.querySelector("main")) {
      document.querySelector("main").setAttribute("data-vivaci-post-slug", slug);
      document.querySelector("main").setAttribute("data-vivaci-post-hydrated", "1");
    }

    document.title = (data.title || "Nyheter") + " — Vivaci Klinik";
    setText('[data-vivaci-field="title"]', data.title);
    setText('[data-vivaci-field="author-name"]', data.author && data.author.name);
    setText('[data-vivaci-field="author-name-footer"]', data.author && data.author.name);
    setText('[data-vivaci-field="date"]', data.date);
    setText('[data-vivaci-field="read-time"]', data.readTime);
    setText('[data-vivaci-field="breadcrumb-category"] div', data.category);

    var roleEl = document.querySelector('[data-vivaci-field="author-role"]');
    if (roleEl && data.author) {
      var line = data.author.role || "";
      if (data.author.bio) {
        line = line ? line + ". " + data.author.bio : data.author.bio;
      }
      roleEl.textContent = line;
    }

    var hero = document.querySelector('[data-vivaci-field="hero-image"]');
    if (hero && data.heroImage) {
      hero.src = data.heroImage;
      hero.alt = data.title || "";
      hero.removeAttribute("srcset");
      hero.removeAttribute("sizes");
    }

    var authorImg = document.querySelector('[data-vivaci-field="author-image"]');
    if (authorImg && data.author && data.author.image) {
      authorImg.src = data.author.image;
      authorImg.alt = data.author.name || "";
    }

    setHtml('[data-vivaci-field="body-html"]', data.bodyHtml);

    var tagList = document.querySelector('[data-vivaci-field="tags-list"]');
    if (tagList && Array.isArray(data.tags)) {
      var sample = tagList.querySelector(".blog-post3-content_tag-item");
      if (sample) {
        tagList.innerHTML = "";
        data.tags.forEach(function (label) {
          var a = sample.cloneNode(true);
          a.href = "/nyheter";
          var div = a.querySelector("div");
          if (div) {
            div.textContent = label;
          }
          tagList.appendChild(a);
        });
      }
    }

    var desc = data.metaDescription || data.excerpt;
    if (desc) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", desc);
      }
    }

    initShareButtons();
  }

  function sharePageUrl() {
    return window.location.href.split("#")[0];
  }

  function sharePageTitle() {
    var h1 = document.querySelector('[data-vivaci-field="title"]');
    if (h1 && h1.textContent) {
      return h1.textContent.trim();
    }
    return document.title.replace(/\s*—\s*Vivaci Klinik\s*$/, "").trim();
  }

  function copyLinkFeedback(link) {
    var prev = link.getAttribute("aria-label") || "";
    link.setAttribute("aria-label", "Länk kopierad");
    window.setTimeout(function () {
      if (prev) {
        link.setAttribute("aria-label", prev);
      }
    }, 2000);
  }

  function initShareButtons() {
    var pageUrl = sharePageUrl();
    var title = sharePageTitle();
    var encodedUrl = encodeURIComponent(pageUrl);
    var encodedTitle = encodeURIComponent(title);

    var configs = [
      {
        label: "Kopiera länk till inlägget",
        href: pageUrl,
        action: function (e, link) {
          e.preventDefault();
          var text = sharePageUrl();
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
              copyLinkFeedback(link);
            });
            return;
          }
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            copyLinkFeedback(link);
          } finally {
            document.body.removeChild(ta);
          }
        },
      },
      {
        label: "Dela på LinkedIn",
        href:
          "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl,
        external: true,
      },
      {
        label: "Dela på X",
        href:
          "https://twitter.com/intent/tweet?url=" +
          encodedUrl +
          "&text=" +
          encodedTitle,
        external: true,
      },
      {
        label: "Dela på Facebook",
        href: "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl,
        external: true,
      },
    ];

    document
      .querySelectorAll(".blog-post3-header_share, .blog-post3-content_share")
      .forEach(function (grid) {
        var links = grid.querySelectorAll("a");
        configs.forEach(function (cfg, i) {
          var link = links[i];
          if (!link) {
            return;
          }
          link.setAttribute("aria-label", cfg.label);
          link.setAttribute("href", cfg.href);
          if (cfg.external) {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
          } else {
            link.removeAttribute("target");
          }
          if (cfg.action && link.getAttribute("data-vivaci-share-copy") !== "1") {
            link.setAttribute("data-vivaci-share-copy", "1");
            link.addEventListener("click", function (e) {
              cfg.action(e, link);
            });
          }
        });
      });
  }
})();
