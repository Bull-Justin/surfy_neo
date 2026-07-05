import test from "node:test";
import assert from "node:assert/strict";
import { initLastfm } from "../src/js/lastfm.js";

function stub({ fetchImpl } = {}) {
  const orig = { fetch: global.fetch, setInterval: global.setInterval };
  global.setInterval = () => 0; 
  if (fetchImpl) global.fetch = fetchImpl;
  return () => Object.assign(global, orig);
}

const track = (over = {}) => ({
  ok: true,
  json: async () => ({
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
  }),
});

test("initLastfm does nothing when credentials are missing", () => {
  let fetched = false;
  const restore = stub({ fetchImpl: () => ((fetched = true), Promise.resolve()) });
  const el = { dataset: {}, innerHTML: "untouched" };
  initLastfm(el);
  assert.equal(fetched, false);
  assert.equal(el.innerHTML, "untouched");
  restore();
});

test("initLastfm renders the current track", async () => {
  const restore = stub({ fetchImpl: async () => track() });
  const el = { dataset: { lastfmUser: "u", lastfmKey: "k" }, innerHTML: "" };
  initLastfm(el);
  await new Promise((r) => setTimeout(r, 10)); // let the async refresh settle
  assert.match(el.innerHTML, /now playing/);
  assert.match(el.innerHTML, /Song Title/);
  assert.match(el.innerHTML, /Some Artist/);
  restore();
});

test("initLastfm escapes track data to prevent injection", async () => {
  const restore = stub({
    fetchImpl: async () => track({ name: "<script>alert(1)</script>" }),
  });
  const el = { dataset: { lastfmUser: "u", lastfmKey: "k" }, innerHTML: "" };
  initLastfm(el);
  await new Promise((r) => setTimeout(r, 10));
  assert.doesNotMatch(el.innerHTML, /<script>/);
  assert.match(el.innerHTML, /&lt;script&gt;/);
  restore();
});

test('initLastfm shows "signal lost" when the request fails', async () => {
  const restore = stub({
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  const el = { dataset: { lastfmUser: "u", lastfmKey: "k" }, innerHTML: "" };
  initLastfm(el);
  await new Promise((r) => setTimeout(r, 10));
  assert.match(el.innerHTML, /signal lost/);
  restore();
});
