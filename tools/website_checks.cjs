"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../website");
const output = path.resolve(__dirname, "../build/screenshots");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png" };
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const relative = decodeURIComponent(url.pathname.replace(/^\/LunaEditor\//, ""));
    const file = path.resolve(root, relative || "index.html");
    if (!file.startsWith(root + path.sep)) throw new Error("Outside website");
    const data = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    response.end(data);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
});

async function main() {
  await fs.mkdir(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/LunaEditor/`;
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await context.route("https://api.github.com/**", route => route.fulfill({ status: 404, body: "{}" }));
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    assert.match(await page.title(), /^Luna/);
    assert.match(await page.locator("#release-status").innerText(), /hasn’t been published/);
    assert.equal(await page.locator("#download-button").getAttribute("href"), "https://github.com/BadpigStudios/LunaEditor/releases");
    await page.getByRole("tab", { name: "Shape your sound" }).click();
    assert.equal(await page.locator("#tool-image").getAttribute("src"), "assets/music.webp");
    await page.keyboard.press("Home");
    assert.equal(await page.locator("#tab-edit").getAttribute("aria-selected"), "true");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#tab-look").getAttribute("aria-selected"), "true");
    await page.keyboard.press("End");
    assert.equal(await page.locator("#tab-music").getAttribute("aria-selected"), "true");
    await page.locator("#tab-edit").click();
    await page.locator("summary").first().click();
    assert.equal(await page.locator("details").first().getAttribute("open"), "");
    assert(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)));
    assert(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every(link => link.hash === "" || document.querySelector(link.hash))));
    await page.locator("h1").click();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(output, "luna-website-desktop.png"), fullPage: true });
    await page.screenshot({ path: path.join(output, "luna-website-hero.png") });
    assert.equal(await page.locator(".platform-card").count(), 3);
    assert.match(await page.locator(".platform-card").nth(1).innerText(), /Experimental-alpha.*planned/s);
    assert.match(await page.locator(".platform-card").nth(2).innerText(), /No Android build is available/);
    for (const width of [320, 375, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => [...document.querySelectorAll("body *")].filter(item => {
        const bounds = item.getBoundingClientRect();
        return bounds.right > innerWidth + 1 && getComputedStyle(item).position !== "absolute";
      }).slice(0, 8).map(item => `${item.tagName}.${item.className}: ${Math.round(item.getBoundingClientRect().right)}`));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}px: ${overflow.join(", ")}`);
      if (width === 375) {
        await page.screenshot({ path: path.join(output, "luna-website-mobile.png"), fullPage: true });
        await page.screenshot({ path: path.join(output, "luna-website-mobile-hero.png") });
      }
    }
    await page.getByRole("link", { name: /Explore the Linux plan/ }).click();
    await page.getByRole("heading", { name: "Linux, one working edit at a time." }).waitFor();
    assert.match(await page.locator(".roadmap-notice").innerText(), /Neither port has entered development/);
    assert.equal(await page.locator('a[href$=".apk"],a[href$=".flatpak"],a[href$=".AppImage"]').count(), 0);
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Roadmap overflow at ${width}px`);
    }
    // Open the unfragmented page for the hero capture after exercising #linux navigation.
    await page.goto(url + "platforms.html", { waitUntil: "networkidle" });
    assert(await page.locator("header .wordmark").isVisible());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(output, "luna-platform-roadmap.png") });
    await page.getByRole("link", { name: "User guide", exact: true }).first().click();
    assert.match(page.url(), /\/LunaEditor\/user-guide\.html$/);
    await page.getByRole("heading", { name: "Luna user guide", exact: true }).waitFor();
    assert.equal(await page.locator(".guide-section").count(), 17);
    assert.match(await page.locator(".guide-hero").innerText(), /LUNA 0\.26\.8/);
    assert(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every(link => document.getElementById(link.hash.slice(1)))));
    const search = page.locator("#guide-search");
    await search.fill("SoundFont");
    assert(await page.locator("#music").isVisible());
    assert.equal(await page.locator("#your-first-edit").isVisible(), false);
    assert.match(await page.locator("#guide-results").innerText(), /sections match/);
    await search.fill("this topic cannot exist 12345");
    assert(await page.locator("#guide-empty").isVisible());
    await page.getByRole("link", { name: "Export", exact: true }).first().click();
    await page.waitForFunction(() => !document.querySelector("#export").hidden);
    assert.equal(await search.inputValue(), "");
    assert.match(await page.locator("#export").innerText(), /Sequence.*every tab/s);
    assert.match(await page.locator("#captions-and-subtitles").innerText(), /SRT.*VTT/s);
    assert.match(await page.locator("#automatic-music-ducking").innerText(), /gain curve/);
    assert.match(await page.locator("#controlled-prerender").innerText(), /disk cache budget/);
    await search.fill("keyframes");
    await search.press("Escape");
    assert.equal(await page.locator(".guide-section:visible").count(), 17);
    await search.fill("music");
    await page.locator("#guide-clear").click();
    assert.equal(await search.inputValue(), "");
    await page.evaluate(async () => {
      for (const image of document.images) { image.loading = "eager"; await image.decode(); }
    });
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Guide overflow at ${width}px`);
      if (width === 375 || width === 1440) await page.screenshot({ path: path.join(output, `luna-guide-${width}.png`) });
    }
    await context.close();

    const release = await browser.newContext();
    await release.route("https://api.github.com/**", route => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify([{ tag_name: "older", published_at: "2026-11-01T00:00:00Z", assets: [] }, { tag_name: "alpha-0.26.0", published_at: "2026-11-03T00:00:00Z", assets: [{ name: "Luna-0.26.0-windows-x64-setup.exe", size: 64000000, browser_download_url: "https://github.com/BadpigStudios/LunaEditor/releases/download/alpha-0.26.0/Luna-0.26.0-windows-x64-setup.exe" }, { name: "Luna-0.26.0-windows-x64.zip", size: 89128960, browser_download_url: "https://github.com/BadpigStudios/LunaEditor/releases/download/alpha-0.26.0/Luna-0.26.0-windows-x64.zip" }] }])
    }));
    const released = await release.newPage();
    await released.goto(url, { waitUntil: "networkidle" });
    assert.match(await released.locator("#download-label").innerText(), /^Download Luna/);
    assert.match(await released.locator("#download-button").getAttribute("href"), /releases\/download\/alpha-0.26.0/);
    assert.match(await released.locator("#release-status").innerText(), /EXE installer/);
    assert.match(await released.locator("#download-button").getAttribute("href"), /\.exe$/);
    assert.match(await released.locator("#portable-download").getAttribute("href"), /\.zip$/);
    assert.equal(await released.locator("[data-installer-link]").count(), 3);
    for (const link of await released.locator("[data-installer-link]").all())
      assert.match(await link.getAttribute("href"), /Luna-0\.26\.0-windows-x64-setup\.exe$/);
    assert.equal(await released.locator("[data-version]").first().innerText(), "0.26.0");
    await release.close();

    // A future Linux-only release must not hijack the Windows installer/ZIP.
    const platforms = await browser.newContext();
    const windowsAssets = [
      { name: "Luna-0.26.8-windows-x64-setup.exe", size: 65000000, browser_download_url: "https://github.com/BadpigStudios/LunaEditor/releases/download/v0.26.8/Luna-0.26.8-windows-x64-setup.exe" },
      { name: "Luna-0.26.8-windows-x64.zip", size: 86000000, browser_download_url: "https://github.com/BadpigStudios/LunaEditor/releases/download/v0.26.8/Luna-0.26.8-windows-x64.zip" }
    ];
    await platforms.route("https://api.github.com/**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
      { tag_name: "linux-experimental-alpha", published_at: "2026-11-05T00:00:00Z", prerelease: true, assets: [{ name: "Luna-linux-x86_64.flatpak", browser_download_url: "https://example.com/linux.flatpak" }] },
      { tag_name: "v0.26.8", published_at: "2026-11-03T00:00:00Z", assets: windowsAssets }
    ]) }));
    const mixed = await platforms.newPage();
    await mixed.goto(url, { waitUntil: "networkidle" });
    assert.match(await mixed.locator("#download-button").getAttribute("href"), /v0\.26\.8.*\.exe$/);
    assert.match(await mixed.locator("#portable-download").getAttribute("href"), /v0\.26\.8.*\.zip$/);
    await platforms.close();

    const unsafe = await browser.newContext();
    await unsafe.route("https://api.github.com/**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
      { tag_name: "v0.26.8", published_at: "2026-11-03T00:00:00Z", assets: windowsAssets.map(asset => ({ ...asset, browser_download_url: "https://example.com/fake.exe" })) }
    ]) }));
    const guarded = await unsafe.newPage();
    await guarded.goto(url, { waitUntil: "networkidle" });
    assert.equal(await guarded.locator("#download-button").getAttribute("href"), "https://github.com/BadpigStudios/LunaEditor/releases");
    await unsafe.close();

    const offline = await browser.newContext({ reducedMotion: "reduce" });
    await offline.route("https://api.github.com/**", route => route.abort());
    const fallback = await offline.newPage();
    await fallback.goto(url, { waitUntil: "networkidle" });
    assert.equal(await fallback.locator("#download-button").getAttribute("href"), "https://github.com/BadpigStudios/LunaEditor/releases");
    await offline.close();

    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const plain = await noScript.newPage();
    await plain.goto(url, { waitUntil: "networkidle" });
    assert(await plain.locator("h1").isVisible());
    assert(await plain.locator("#download-button").isVisible());
    await plain.goto(url + "platforms.html", { waitUntil: "networkidle" });
    assert(await plain.locator("#linux").isVisible() && await plain.locator("#android").isVisible());
    await plain.goto(url + "user-guide.html", { waitUntil: "networkidle" });
    assert.equal(await plain.locator(".guide-section:visible").count(), 17);
    await noScript.close();

    // Only the private editor checkout includes the packaged, self-contained manual.
    const localGuide = path.resolve(__dirname, "../docs/user-guide.html");
    if (await fs.stat(localGuide).catch(() => null)) {
      const manual = await browser.newContext({ offline: true });
      const local = await manual.newPage();
      local.on("pageerror", error => errors.push(error.message));
      await local.goto(pathToFileURL(localGuide).href);
      await local.locator("#guide-search").fill("sequences");
      assert(await local.locator("#sequences").isVisible());
      assert(await local.evaluate(async () => {
        for (const image of document.images) { image.loading = "eager"; await image.decode(); }
        return [...document.images].every(image => image.src.startsWith("data:"));
      }));
      await manual.close();
    }
    assert.deepEqual(errors, []);
    console.log("PASS: responsive homepage/guide/roadmap; keyboard tabs; accurate platform availability; three installer links; ZIP/latest-Windows selection; unsafe/offline fallbacks; guide search/anchors and offline manual; no-script content; no browser errors.");
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
