/**
 * Hide body until DM Sans is available — prevents fallback-font flash (FOUT).
 */
(function () {
  var root = document.documentElement;
  if (!document.fonts || !document.fonts.load) return;

  root.classList.add("vivaci-fonts-pending");

  function ready() {
    root.classList.remove("vivaci-fonts-pending");
    root.classList.add("vivaci-fonts-ready");
  }

  Promise.all([
    document.fonts.load('400 1rem "DM Sans"'),
    document.fonts.load('600 1rem "DM Sans"'),
  ])
    .then(ready)
    .catch(ready);

  document.fonts.ready.then(ready);

  setTimeout(ready, 2500);
})();
