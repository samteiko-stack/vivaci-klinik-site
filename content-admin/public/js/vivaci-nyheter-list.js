/**
 * Hydrate /nyheter listing grid from content/nyheter/index.json
 */
(function () {
  "use strict";

  var INDEX_URL = "/content/nyheter/index.json";

  function hydrate() {
    var grid = document.querySelector('[data-vivaci-field="nyheter-grid"]');
    if (!grid) {
      return Promise.resolve();
    }

    var template = grid.querySelector("[data-vivaci-nyheter-item]");
    if (!template) {
      return Promise.resolve();
    }
    var templateHtml = template.outerHTML;

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(INDEX_URL)
      : fetch(INDEX_URL).then(function (res) {
          return res.ok ? res.json() : Promise.reject();
        });

    return req
      .then(function (data) {
        var posts = (data && data.posts) || [];
        grid.innerHTML = "";
        posts.forEach(function (post) {
          var wrap = document.createElement("div");
          wrap.innerHTML = templateHtml;
          var item = wrap.firstElementChild;
          if (!item) {
            return;
          }
          item.removeAttribute("data-vivaci-nyheter-item");

          var link = item.querySelector(".blog34_item-link");
          if (link) {
            link.href = post.path || "/nyheter/" + post.slug;
          }

          var img = item.querySelector(".blog34_image");
          if (img && post.heroImage) {
            img.src = post.heroImage;
            img.alt = post.title || "";
            img.removeAttribute("srcset");
            img.removeAttribute("sizes");
          }

          var cat = item.querySelector(".tag div");
          if (cat) {
            cat.textContent = post.category || "Nyheter";
          }

          var read = item.querySelector(".blog34_meta-wrapper .text-size-small");
          if (read) {
            read.textContent = post.readTime || "";
          }

          var title = item.querySelector(".heading-style-h5");
          if (title) {
            title.textContent = post.title || "";
          }

          grid.appendChild(item);
        });
      })
      .catch(function () {
        /* static fallback cards remain */
      });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(hydrate);
  } else {
    hydrate();
  }
})();
