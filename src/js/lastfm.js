// Last.fm "now playing" widget. Reads its config from the target element
// data-lastfm-user / data-lastfm-key attributes
import { esc } from "./dom.js";

const REFRESH_MS = 180000; 
const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f"; 

export function initLastfm(el) {
  const user = el.dataset.lastfmUser;
  const key = el.dataset.lastfmKey;
  if (!user || !key) return;
  refresh(el, user, key);
  setInterval(() => refresh(el, user, key), REFRESH_MS);
}

async function refresh(el, user, key) {
  try {
    const url =
      "https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks" +
      `&user=${encodeURIComponent(user)}` +
      `&api_key=${encodeURIComponent(key)}` +
      "&format=json&limit=1";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`lastfm: ${res.status}`);
    const data = await res.json();

    const tracks = data.recenttracks?.track;
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
  } catch (e) {
    el.innerHTML = '<span class="empty">signal lost.</span>';
  }
}
