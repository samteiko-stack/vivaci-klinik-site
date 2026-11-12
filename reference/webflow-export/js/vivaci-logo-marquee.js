/**
 * Varumärken logo marquee — measure, clone, CSS vars. Re-run after brands hydrate.
 */
(function () {
  if (window.__vivaciLogoMarqueeLoaded) return;
  window.__vivaciLogoMarqueeLoaded = true;

  function originalsInTrack(track) {
    return Array.from(track.children).filter(function (el) {
      return el.dataset.marqueeClone !== "true";
    });
  }

  function waitForImages(track) {
    var images = Array.from(track.querySelectorAll("img"));
    if (!images.length) return Promise.resolve();
    return Promise.all(
      images.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })
    );
  }

  function buildMarquee(row, track) {
    track
      .querySelectorAll('[data-marquee-clone="true"]')
      .forEach(function (clone) {
        clone.remove();
      });

    track.style.animation = "none";
    track.style.transform = "none";

    var originals = originalsInTrack(track);
    if (!originals.length) return;

    originals.forEach(function (item) {
      item.dataset.marqueeOriginal = "true";
    });

    var firstOriginal = originals[0];
    var lastOriginal = originals[originals.length - 1];
    var sequenceWidth =
      lastOriginal.offsetLeft + lastOriginal.offsetWidth - firstOriginal.offsetLeft;

    if (sequenceWidth <= 0) {
      requestAnimationFrame(function () {
        buildMarquee(row, track);
      });
      return;
    }

    var minimumWidth = row.clientWidth + sequenceWidth * 2;
    while (track.scrollWidth < minimumWidth) {
      originals.forEach(function (item) {
        var clone = item.cloneNode(true);
        clone.removeAttribute("data-marquee-original");
        clone.dataset.marqueeClone = "true";
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });
    }

    row.style.setProperty("--marquee-distance", sequenceWidth + "px");

    var speed = window.innerWidth <= 767 ? 90 : 70;
    row.style.setProperty("--marquee-duration", sequenceWidth / speed + "s");

    void track.offsetWidth;
    track.style.animation = "";
  }

  function initRow(row) {
    var track = row.querySelector(".logo-marquee_track");
    if (!track) return;

    waitForImages(track).then(function () {
      buildMarquee(row, track);
    });

    if (row.dataset.marqueeResizeBound === "1") return;
    row.dataset.marqueeResizeBound = "1";

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildMarquee(row, track);
      }, 250);
    });
  }

  function initLogoMarquees() {
    document.querySelectorAll(".logo-marquee_row").forEach(initRow);
  }

  window.initLogoMarquees = initLogoMarquees;
  window.addEventListener("load", initLogoMarquees);
  window.addEventListener("vivaci:brands-hydrated", initLogoMarquees);
})();
