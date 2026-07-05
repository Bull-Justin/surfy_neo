import test from "node:test";
import assert from "node:assert/strict";
import { initLastfm, render } from "../src/js/lastfm.js";

const payload = (over = {}) => ({
  recenttracks: {
    track: [
      {
        name: "Song Title",
        artist: { "#text": "Some Artist" },
        "@attr": { nowplaying: "true" },
        image: [{ size: "medium", "#text": "http://example/art.png" }],
        ...over,
      },
    ],
  },
});

test("initLastfm does nothing (and touches no DOM) without credentials", () => {
  const el = { dataset: {}, innerHTML: "untouched" };
  initLastfm(el);
  assert.equal(el.innerHTML, "untouched");
});

test("render shows the current track", () => {
  const el = { innerHTML: "" };
  render(el, payload());
  assert.match(el.innerHTML, /now playing/);
  assert.match(el.innerHTML, /Song Title/);
  assert.match(el.innerHTML, /Some Artist/);
});

test("render marks a non-nowplaying track as last played", () => {
  const el = { innerHTML: "" };
  render(el, payload({ "@attr": undefined }));
  assert.match(el.innerHTML, /last played/);
});

test("render escapes track data to prevent injection", () => {
  const el = { innerHTML: "" };
  render(el, payload({ name: "<script>alert(1)</script>" }));
  assert.doesNotMatch(el.innerHTML, /<script>/);
  assert.match(el.innerHTML, /&lt;script&gt;/);
});

test("render falls back when nothing has been scrobbled", () => {
  const el = { innerHTML: "" };
  render(el, { recenttracks: {} });
  assert.match(el.innerHTML, /nothing scrobbled/);
});

test("render falls back on a Last.fm error payload", () => {
  const el = { innerHTML: "" };
  render(el, { error: 10, message: "Invalid API key" });
  assert.match(el.innerHTML, /nothing scrobbled/);
});
