import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import {
  dateToRfc3339,
  getNewestCollectionItemDate,
} from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  // Static assets copied through untouched. paths under _site/.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

  // RSS/Atom feed helpers (used by src/feed.njk). htmlBaseUrl / transformWithHtmlBase come from the HTML <base> plugin below
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addFilter("dateToRfc3339", dateToRfc3339);
  eleventyConfig.addFilter("newestDate", getNewestCollectionItemDate);

  // Rebuild when CSS/JS change even though they aren't templates.
  eleventyConfig.addWatchTarget("src/css");
  eleventyConfig.addWatchTarget("src/js");

  // Filters 

  // ISO date (YYYY-MM-DD) -> "Apr 07, 2026" 
  eleventyConfig.addFilter("displayDate", (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    });
  });

  // ISO date (YYYY-MM-DD) -> "July 2026"
  eleventyConfig.addFilter("displayMonth", (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  });

  // ISO date or "YYYY-MM" slug -> "July" (month name only)
  eleventyConfig.addFilter("monthName", (value) => {
    if (!value) return "";
    const iso = String(value).length === 7 ? `${value}-01` : value;
    const d = iso instanceof Date ? iso : new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  });

  // Date -> "2026", or first 4 chars of a "YYYY-.." string slug.
  eleventyConfig.addFilter("year", (value) => {
    if (!value) return "";
    if (value instanceof Date) return String(value.getUTCFullYear());
    return String(value).slice(0, 4);
  });

  // First N chars of a string, for the home-page preview snippets.
  eleventyConfig.addFilter("excerpt", (text, len = 130) => {
    const s = String(text ?? "").trim();
    return s.length > len ? `${s.slice(0, len)}…` : s;
  });

  // Collections

  // Newest first; ties broken by filename so ordering is deterministic regardless of order.
  const newestFirst = (a, b) =>
    b.date - a.date || a.inputPath.localeCompare(b.inputPath);

  // Blog posts. draft: true excluded.
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/blog/posts/*.md")
      .filter((p) => !p.data.draft)
      .sort(newestFirst)
  );

  // Music reviews. Drafts excluded.
  eleventyConfig.addCollection("reviews", (api) =>
    api
      .getFilteredByGlob("src/music/reviews/*.md")
      .filter((p) => !p.data.draft)
      .sort(newestFirst)
  );

  // Monthly playlists grouped by year, for the /music/playlists/ drilldown.
  // Files are named YYYY-MM.md, so the year/month come straight from the slug
  // (no timezone guesswork). Newest year first; months ascending within a year.
  eleventyConfig.addCollection("playlistYears", (api) => {
    const byYear = new Map();
    for (const item of api
      .getFilteredByGlob("src/music/playlists/*.md")
      .filter((p) => !p.data.draft)) {
      const [year, month] = item.fileSlug.split("-");
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push({
        year,
        month,
        iso: `${year}-${month}-01`,
        url: `/music/playlists/${year}/${month}/`,
      });
    }
    return [...byYear.entries()]
      .map(([year, months]) => ({
        year,
        months: months.sort((a, b) => a.month.localeCompare(b.month)),
      }))
      .sort((a, b) => b.year.localeCompare(a.year));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
