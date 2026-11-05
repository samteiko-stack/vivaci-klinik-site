/**
 * Wire homepage blog slider cards to /nyheter/{slug} from index.json
 */
(function () {
  "use strict";

  var INDEX_URL = "/content/nyheter/index.json";

  function hydrate() {
    var section = document.querySelector(".testimonial5_component .swiper3");
    if (!section) {
      return Promise.resolve();
    }

    var req = window.vivaciFetchJson
      ? window.vivaciFetchJson(INDEX_URL)
      : fetch(INDEX_URL).then(function (res) {
          return res.ok ? res.json() : Promise.reject();
        });

    return req
      .then(function (data) {
        var posts = (data && data.posts) || [];
        if (!posts.length) {
          return;
        }
        var slides = section.querySelectorAll(".swiper-slide .blog34_item");
        slides.forEach(function (item, i) {
          var post = posts[i % posts.length];
          if (!post) {
            return;
          }
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
        });
      })
      .catch(function () {
        /* keep placeholder cards */
      });
  }

  if (window.vivaciOnLocaleContentReady) {
    window.vivaciOnLocaleContentReady(hydrate);
  } else {
    hydrate();
  }
})();
