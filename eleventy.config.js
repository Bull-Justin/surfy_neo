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
