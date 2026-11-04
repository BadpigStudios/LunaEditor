"use strict";

const tools = {
  edit: {
    number: "01 / THE EDIT", title: "A timeline that gives ideas room.",
    description: "Arrange visual and audio tracks, trim from either edge, and move a whole selection together. Snapping keeps your cuts where you want them.",
    details: ["Multitrack editing & group selection", "Caption tracks with SRT / VTT import & export", "Ripple edits, markers & source organization"],
    image: "workspace.webp", alt: "Video clips arranged on Luna's multitrack timeline.",
    caption: "A real Luna workspace, with original demo artwork."
  },
  look: {
    number: "02 / THE LOOK", title: "Set the mood. Make it yours.",
    description: "Explore bundled transitions, titles, stickers and effects. Style your titles, correct your colors, and fine-tune the details in the Inspector.",
    details: ["Transitions attached to clip edges and cuts", "Title typography, shadows, gradients & depth", "Color correction, chroma key & visual effects"],
    image: "effects.webp", alt: "Luna's bundled effects and transitions gallery beside the editing workspace.",
    caption: "Bundled presets, with controls to make them your own."
  },
  motion: {
    number: "03 / THE MOTION", title: "Give every moment a little movement.",
    description: "Create keyframes right on your clips and shape the movement with easing. Use the preview handles to position, scale and warp visual layers.",
    details: ["Visible, draggable keyframes on clips", "Auto-key, easing presets & curve controls", "Position, scale & warp in the preview"],
    image: "keyframes.webp", alt: "Visible keyframe diamonds and animation controls on a clip in Luna.",
    caption: "Animation you can see, directly on the timeline."
  },
  music: {
    number: "04 / THE SOUND", title: "Let your story find its rhythm.",
    description: "Write a melody in the piano roll, paint a rhythm, or start with a chord progression. Draw notes, shape velocity, and audition your pattern.",
    details: ["Piano roll, MIDI & SoundFont 2 instruments", "Dialogue-driven music ducking & editable gain curves", "Audio mixer, effects & audio-only export"],
    image: "music.webp", alt: "Luna's piano roll with notes, a piano keyboard and a velocity lane.",
    caption: "A place for the soundtrack, right inside your editor."
  }
};

const tabs = [...document.querySelectorAll("[data-tool]")];
function selectTool(tab, focus = false) {
  const tool = tools[tab.dataset.tool];
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  document.querySelector("#tool-panel").setAttribute("aria-labelledby", tab.id);
  document.querySelector("#tool-number").textContent = tool.number;
  document.querySelector("#tool-title").textContent = tool.title;
  document.querySelector("#tool-description").textContent = tool.description;
  document.querySelector("#tool-details").replaceChildren(...tool.details.map(text => {
    const item = document.createElement("li"); item.textContent = text; return item;
  }));
  const image = document.querySelector("#tool-image");
  image.src = `assets/${tool.image}`;
  image.alt = tool.alt;
  document.querySelector("#tool-caption").textContent = tool.caption;
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTool(tab));
  tab.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault(); selectTool(tabs[next], true);
  });
});

// The site remains useful without JavaScript, network access, or a published release.
// Only public GitHub metadata is requested. No token, account, or analytics is used.
async function loadRelease() {
  const status = document.querySelector("#release-status");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("https://api.github.com/repos/BadpigStudios/LunaEditor/releases?per_page=20", {
      headers: { Accept: "application/vnd.github+json" }, signal: controller.signal
    });
    if (response.status === 404) {
      status.textContent = "A public Windows release hasn’t been published yet. Follow the project on GitHub.";
      return;
    }
    if (!response.ok) {
      status.textContent = "Couldn’t check the latest release. Browse GitHub Releases to download Luna.";
      return;
    }
    const published = await response.json();
    const installerName = /^Luna-(\d+\.\d+\.\d+)-windows-x64-setup\.exe$/i;
    const portableName = /^Luna-(\d+\.\d+\.\d+)-windows-x64\.zip$/i;
    const windowsAsset = asset => typeof asset?.name === "string" && (installerName.test(asset.name) || portableName.test(asset.name));
    const releases = (Array.isArray(published) ? published : [published]).filter(item => item && !item.draft);
    // A future Linux/Android release must not replace the Windows download.
    const release = releases.sort((a, b) => Date.parse(b.published_at || b.created_at) - Date.parse(a.published_at || a.created_at))
      .find(item => Array.isArray(item.assets) && item.assets.some(windowsAsset));
    if (!release) { status.textContent = "No public Windows release is available yet."; return; }
    const assets = release.assets || [];
    function downloadUrl(asset) {
      if (!asset) return null;
      try {
        const url = new URL(asset.browser_download_url);
        return url.protocol === "https:" && url.hostname === "github.com" && !url.port && !url.username && !url.password &&
          url.pathname.startsWith("/BadpigStudios/LunaEditor/releases/download/") ? url.href : null;
      } catch { return null; }
    }
    const installer = assets.find(item => installerName.test(item.name));
    const portable = assets.find(item => portableName.test(item.name));
    const installerUrl = downloadUrl(installer);
    const portableUrl = downloadUrl(portable);
    if (installerUrl) {
      document.querySelectorAll("[data-installer-link]").forEach(link => { link.href = installerUrl; });
      document.querySelector("#download-label").textContent = "Download Luna installer";
      status.textContent = `${release.tag_name} · Windows x64 · EXE installer · ${(installer.size / 1048576).toFixed(1)} MB`;
    } else {
      status.textContent = "No Windows installer in the latest release. Browse releases or use the portable ZIP.";
    }
    if (portableUrl) {
      document.querySelector("#portable-download").href = portableUrl;
      document.querySelector("#portable-download").textContent = "Download portable ZIP";
    } else {
      document.querySelector("#portable-download").href = "https://github.com/BadpigStudios/LunaEditor/releases";
      document.querySelector("#portable-download").textContent = "Portable ZIP unavailable · browse releases ↗";
    }
    const installerVersion = installer?.name.match(/^Luna-(\d+\.\d+\.\d+)-windows-x64-setup\.exe$/i)?.[1];
    const releaseVersion = installerVersion || (/^v?\d+\.\d+\.\d+$/.test(release.tag_name) ? release.tag_name.replace(/^v/, "") : null);
    if (releaseVersion) document.querySelectorAll("[data-version]").forEach(item => { item.textContent = releaseVersion; });
  } catch {
    status.textContent = "Couldn’t check the latest release. Browse GitHub Releases to download Luna.";
    // Keep the ordinary Releases links when offline or rate-limited.
  } finally {
    clearTimeout(timeout);
  }
}
loadRelease();
