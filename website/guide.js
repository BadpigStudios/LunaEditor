"use strict";

const search = document.querySelector("#guide-search");
const sections = [...document.querySelectorAll(".guide-section")];
const links = [...document.querySelectorAll("[data-guide-link]")];
const count = document.querySelector("#guide-results");
const clear = document.querySelector("#guide-clear");

function filterGuide() {
  const query = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  sections.forEach(section => {
    const matches = !query || section.textContent.toLocaleLowerCase().includes(query);
    section.hidden = !matches;
    links.find(link => link.hash === `#${section.id}`).hidden = !matches;
    if (matches) visible++;
  });
  count.textContent = query ? (document.documentElement.lang === "es" ? `${visible} de ${sections.length} secciones coinciden.` : `${visible} of ${sections.length} sections match.`) : "";
  clear.disabled = !query;
  document.querySelector("#guide-empty").hidden = visible !== 0;
}
search.addEventListener("input", filterGuide);
clear.addEventListener("click", () => { search.value = ""; filterGuide(); search.focus(); });
search.addEventListener("keydown", event => {
  if (event.key === "Escape") { search.value = ""; filterGuide(); }
});
window.addEventListener("hashchange", () => {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target && target.hidden) {
    search.value = ""; filterGuide(); target.scrollIntoView();
  }
});
