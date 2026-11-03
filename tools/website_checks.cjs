"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
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
    for (const width of [320, 375, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => [...document.querySelectorAll("body *")].filter(item => {
        const bounds = item.getBoundingClientRect();
        return bounds.right > innerWidth + 1 && getComputedStyle(item).position !== "absolute";
      }).slice(0, 8).map(item => `${item.tagName}.${item.className}: ${Math.round(item.getBoundingClientRect().right)}`));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}px: ${overflow.join(", ")}`);
      if (width === 375) await page.screenshot({ path: path.join(output, "luna-website-mobile.png"), fullPage: true });
    }
    await context.close();

    const release = await browser.newContext();
    await release.route("https://api.github.com/**", route => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify({ tag_name: "v0.26.0", assets: [{ name: "Luna-0.26.0-windows-x64.zip", size: 89128960, browser_download_url: "https://github.com/BadpigStudios/LunaEditor/releases/download/v0.26.0/Luna-0.26.0-windows-x64.zip" }] })
    }));
    const released = await release.newPage();
    await released.goto(url, { waitUntil: "networkidle" });
    assert.match(await released.locator("#download-label").innerText(), /^Download Luna/);
    assert.match(await released.locator("#download-button").getAttribute("href"), /releases\/download\/v0.26.0/);
    assert.match(await released.locator("#release-status").innerText(), /85.0 MB/);
    await release.close();

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
    await noScript.close();
    assert.deepEqual(errors, []);
    console.log("PASS: desktop/mobile layouts, no horizontal overflow, local assets under /LunaEditor/, keyboard tabs, FAQ, actual-release download, absent/offline release fallbacks, reduced motion, no-script content, and no browser errors.");
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
