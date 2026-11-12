/**
 * Swap img src after decode — avoids empty→loaded flicker on hydration.
 */
(function () {
  if (window.VivaciImage) return;

  function sameSrc(img, src) {
    if (!img || !src) return true;
    try {
      var a = img.currentSrc || img.src || "";
      if (!a) return false;
      return a === src || a.indexOf(src) !== -1 || src.indexOf(a) !== -1;
    } catch (_) {
      return false;
    }
  }

  window.VivaciImage = {
    apply: function (img, src, alt, options) {
      options = options || {};
      if (!img || !src) return Promise.resolve();
      if (sameSrc(img, src)) {
        if (alt) img.alt = alt;
        return Promise.resolve();
      }
      if (options.loading) img.loading = options.loading;
      if (options.fetchPriority && "fetchPriority" in img) {
        img.fetchPriority = options.fetchPriority;
      }
      return new Promise(function (resolve) {
        var probe = new Image();
        probe.onload = probe.onerror = function () {
          img.src = src;
          img.removeAttribute("srcset");
          img.removeAttribute("sizes");
          if (alt) img.alt = alt;
          resolve();
        };
        probe.src = src;
      });
    },
  };
})();
