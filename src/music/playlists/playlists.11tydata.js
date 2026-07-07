// Directory data for the monthly playlist files (YYYY-MM.md).
// The filename slug is the source of truth: it drives the permalink
// (/music/playlists/YYYY/MM/) and the "Month YYYY" page heading.

// "YYYY-MM" slug -> "July 2026"
function monthHeading(slug) {
  const d = new Date(`${slug}-01T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return slug;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default {
  layout: "layouts/playlist-month.njk",
  pageCss: "music.css",
  face: "-.-",
  eleventyComputed: {
    // Drafts get no output page (matches how draft posts/reviews are hidden).
    permalink: (data) =>
      data.draft
        ? false
        : `/music/playlists/${data.page.fileSlug.replace("-", "/")}/`,
    pageTitle: (data) => monthHeading(data.page.fileSlug),
    pageHeading: (data) => monthHeading(data.page.fileSlug),
    pageSubtitle: "",
  },
};
