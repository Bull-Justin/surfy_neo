// Entry point. Content is rendered at build timeby Eleventy so the only runtime work is the Last.fm widget when it's present on the page.
import { initLastfm } from "./lastfm.js";

const np = document.getElementById("now-playing");
if (np) initLastfm(np);
