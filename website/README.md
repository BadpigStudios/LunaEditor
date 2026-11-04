# Luna website

A static, dependency-free site for **https://badpigstudios.github.io/LunaEditor/**.
HTML, CSS, JavaScript, icons and screenshots are self-hosted. There are no trackers, cookies,
external fonts, package installs, or framework builds. All local URLs work under `/LunaEditor/`.

## Publish on GitHub Pages

1. Push the website files to `BadpigStudios/LunaEditor` on `main`.
2. In the repository's **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Run **Actions → Publish Luna website → Run workflow**, or push a change in `website/`.
4. The deployment URL is shown by the workflow and in the `github-pages` environment.

The workflow uploads only this folder, including `.nojekyll`. Native source, local settings,
test media and build output are not website artifacts. Repository Pages settings and permissions
must allow the `github-pages` environment to deploy from `main`.

This follows the [official GitHub Pages custom-workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Windows downloads

The primary download uses the latest public GitHub release's Luna EXE installer. A secondary link uses
that same release's portable ZIP. Missing assets keep links to GitHub Releases and are described
honestly; network/API failures retain useful release-page links. No GitHub token is used.

The maintainer can upload a packaged Windows ZIP to a GitHub Release. Native editor build sources
are not included in this website-only repository. Do not commit executable ZIPs into this website folder.

## Local preview

From the repository root:

```powershell
python -m http.server 4173 --directory website --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. The tool tabs support arrow keys/Home/End and the FAQ uses native
accessible disclosure controls. Motion respects `prefers-reduced-motion`; content and download
links remain usable without JavaScript.

`tools/website_checks.cjs` checks desktop/mobile layouts, keyboard tabs, release success/missing/offline
states, links and browser errors using a locally installed Playwright and Chromium/Edge.
The screenshots show the actual native editor with original, generated demonstration artwork.
The native editor source/capture tools are kept separately; no user footage or project content is published.

## Publication scope

The public repository contains this website and its Pages workflow only. The native editor source,
local Git history, settings, personal media, and binary builds are not part of website publication.
The screenshots use original demo artwork generated for the site.

## Editor guide

`user-guide.html` is the searchable, keyboard-accessible manual linked from the homepage navigation, getting-started section and footer. It also works without JavaScript. The maintainer regenerates it from the separately maintained editor documentation; the public website repository contains only the rendered guide and its web assets.

## Platform roadmap and visual design

The homepage now presents the real editor before decorative artwork, with responsive tool cards, a persistent download action, a guide callout and clear platform availability. `platforms.html` is a public planning overview: Linux is **experimental-alpha · planned**, Android is **planned**, and neither has a download. Technical architecture/acceptance plans stay in the separate editor documentation. Windows installer/ZIP links select the latest public release containing Windows x64 assets, so a future Linux-only prerelease cannot replace them.

The site and guide remain functional without JavaScript. Browser checks cover homepage, guide and roadmap at 320–1440 px, keyboard interactions, API/offline/missing/unsafe assets, and mixed-platform release metadata. No desktop version bump or native rebuild is needed for this website/documentation change.
