# Luna — website

The website for **Luna**, a native video editor for Windows 10 / 11 x64.

**Website:** https://badpigstudios.github.io/LunaEditor/

This repository contains the website and GitHub Pages deployment workflow only.
The native editor source, local project history, personal media and binaries are not published here.

## Publish

Select **Settings → Pages → Source → GitHub Actions**, then run the **Publish Luna website** workflow.
Only the `website/` folder is deployed. See [website/README.md](website/README.md) for local preview and release-link behavior.

The site uses plain HTML, CSS and JavaScript, with self-hosted graphics and original demo screenshots.
Windows ZIP downloads appear when a public GitHub Release is published.

## Browser checks

With Node.js, Playwright and Microsoft Edge available, run `node tools/website_checks.cjs`.
The checks cover narrow/desktop layouts, keyboard tabs, FAQ behavior and release download fallbacks.

[GPL-3.0 license](LICENSE).
