"use strict";
(() => {
  const language = document.documentElement.lang === "es" ? "es" : "en";
  window.lunaText = text => language === "es" ? (window.lunaCatalog?.[text] ?? text) : text;
  const choices = [...document.querySelectorAll("[data-language]")];
  choices.forEach(link => {
    // Only retain an anchor supplied by this site; localized pages share section IDs.
    link.hash = location.hash;
    link.addEventListener("click", () => {
      link.hash = location.hash;
      try { localStorage.setItem("luna-language", link.dataset.language); } catch { /* Storage is optional. */ }
    });
  });
  try {
    const saved = localStorage.getItem("luna-language");
    if ((saved === "en" || saved === "es") && saved !== language) {
      const target = choices.find(link => link.dataset.language === saved);
      if (target && new URL(target.href).origin === location.origin) location.replace(target.href);
    }
  } catch { /* Static pages and language links work with storage disabled. */ }
})();
