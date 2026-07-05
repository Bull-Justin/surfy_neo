// Last.fm "now playing" widget. Reads its config from the target element's
// data-lastfm-user / data-lastfm-key attributes.

import { esc } from "./dom.js";

const REFRESH_MS = 180000; // 3 minutes
const TIMEOUT_MS = 10000;
const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f"; // last.fm's blank-art image

export function initLastfm(el) {
  const user = el.dataset.lastfmUser;
  const key = el.dataset.lastfmKey;
  if (!user || !key) return;
  refresh(el, user, key);
  setInterval(() => refresh(el, user, key), REFRESH_MS);
}

function refresh(el, user, key) {
  const cb = `_lastfm_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const script = document.createElement("script");

  const cleanup = () => {
    delete window[cb];
    script.remove();
  };
  const fail = () => {
    clearTimeout(timer);
    cleanup();
    el.innerHTML = '<div class="np-lost">signal lost</div>';
  };
  const timer = setTimeout(fail, TIMEOUT_MS);

  window[cb] = (data) => {
    clearTimeout(timer);
    cleanup();
    render(el, data);
  };

  script.onerror = fail;
  script.src =
    "https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks" +
    `&user=${encodeURIComponent(user)}` +
    `&api_key=${encodeURIComponent(key)}` +
    `&format=json&limit=1&callback=${cb}`;
  document.head.appendChild(script);
}

// Renders a Last.fm getRecentTracks payload into the widget. Exported for tests.
export function render(el, data) {
  // last.fm JSONP returns { error, message } on failure
  const tracks = data?.recenttracks?.track;
  if (!tracks) {
    el.innerHTML = '<span class="empty">nothing scrobbled yet.</span>';
    return;
  }

  // last.fm returns an object when there's only one track
  const track = Array.isArray(tracks) ? tracks[0] : tracks;
  const isNow = track["@attr"]?.nowplaying === "true";
  const art = track.image?.find((i) => i.size === "medium")?.["#text"];
  const song = track.name ?? "";
  const artist = track.artist?.["#text"] ?? "";
  const hasArt = art && !art.includes(PLACEHOLDER_HASH);

  el.innerHTML = `
    <div class="np-track">
      <div class="np-status ${isNow ? "now" : "last"}">${isNow ? "▶ now playing" : "◎ last played"}</div>
      <div class="np-body">
        ${hasArt
          ? `<img class="np-art" src="${esc(art)}" alt="album art">`
          : '<div class="np-art-placeholder">♪</div>'}
        <div class="np-info">
          <span class="np-song">${esc(song)}</span>
          <span class="np-artist">${esc(artist)}</span>
        </div>
      </div>
    </div>`;
}
