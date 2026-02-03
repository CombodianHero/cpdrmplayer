/* =====================================================
   ENGINEERS BABU – PLAYER
   ===================================================== */

const video = document.getElementById("video");
const container = document.getElementById("player-container");

const playBtn = document.getElementById("play-btn");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const speedBtn = document.getElementById("speed-btn");
const qualityBtn = document.getElementById("quality-btn");
const lockBtn = document.getElementById("lock-btn");
const shotBtn = document.getElementById("shot-btn");

const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const timeEl = document.getElementById("time");

const speedMenu = document.getElementById("speed-menu");
const qualityMenu = document.getElementById("quality-menu");

const seekLeft = document.getElementById("seek-left");
const seekRight = document.getElementById("seek-right");

const API = "https://itsgolu-v1player-api.vercel.app/api/proxy";

let hls = null;
let shakaPlayer = null;
let locked = false;

/* LOAD VIDEO */
(async () => {
  const rawUrl = new URLSearchParams(location.search).get("url");
  if (!rawUrl) return showError("No ClassPlus URL provided");

  try {
    const res = await fetch(`${API}?url=${encodeURIComponent(rawUrl)}`);
    const data = await res.json();

    if (data.MPD && data.KEYS) {
      await loadDRM(data.MPD, data.KEYS);
    } else if (data.url) {
      loadHLS(data.url);
    } else {
      throw new Error("Invalid API response");
    }
  } catch (e) {
    showError(e.message);
  }
})();

/* HLS */
function loadHLS(url) {
  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      buildHLSQualityMenu(data.levels);

      // ✅ AUTOPLAY (NOT MUTED)
      video.muted = false;
      video.play().catch(() => {});
    });
  } else {
    video.src = url;

    video.muted = false;
    video.play().catch(() => {});
  }
}

/* DRM */
async function loadDRM(mpd, keys) {
  shaka.polyfill.installAll();
  shakaPlayer = new shaka.Player(video);

  const clearKeys = {};
  keys.forEach(k => {
    const [kid, key] = k.split(":");
    clearKeys[kid] = key;
  });

  shakaPlayer.configure({
    drm: { clearKeys },
    abr: { enabled: true }
  });

  await shakaPlayer.load(mpd);

  // ✅ AUTOPLAY (NOT MUTED)
  video.muted = false;
  video.play().catch(() => {});
}

/* PLAY / PAUSE */
function togglePlay() {
  if (locked) return;
  video.paused ? video.play() : video.pause();
}

playBtn.onclick = togglePlay;
video.onclick = togglePlay;

video.addEventListener("play", () => playBtn.textContent = "⏸");
video.addEventListener("pause", () => playBtn.textContent = "▶");

/* SPEED MENU (UNCHANGED) */
const SPEEDS = [0.25,0.5,0.75,1,1.25,1.5,2,3,4,5];
speedMenu.innerHTML = SPEEDS.map(s =>
  `<div onclick="setSpeed(${s})">${s}x</div>`
).join("");

function setSpeed(s){
  video.playbackRate = s;
  speedBtn.textContent = s + "x";
  speedMenu.style.display = "none";
}

/* HELPERS */
function showError(msg){
  document.getElementById("error-msg").textContent = msg;
}
