import test from "node:test";
import assert from "node:assert/strict";
import { esc } from "../src/js/dom.js";

test("esc escapes all five HTML-sensitive characters", () => {
  assert.equal(esc(`&<>"'`), "&amp;&lt;&gt;&quot;&#039;");
});

test("esc escapes the ampersand first (no double-encoding of entities)", () => {
  // If & weren't escaped first, "<" would become "&amp;lt;".
  assert.equal(esc("<"), "&lt;");
  assert.equal(esc("&lt;"), "&amp;lt;");
});

test("esc leaves ordinary text untouched", () => {
  assert.equal(esc("hello world 123"), "hello world 123");
});

test("esc coerces null and undefined to an empty string", () => {
  assert.equal(esc(null), "");
  assert.equal(esc(undefined), "");
});

test("esc coerces non-string values to strings", () => {
  assert.equal(esc(42), "42");
  assert.equal(esc(0), "0");
});

test("esc neutralizes a markup-injection attempt", () => {
  assert.equal(
    esc('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
});
