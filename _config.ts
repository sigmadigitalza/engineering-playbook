import lume from "lume/mod.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import nav from "lume/plugins/nav.ts";

const site = lume({
  src: ".",
  dest: "dist",
  location: new URL("https://sigmadigitalza.github.io/engineering-playbook/"),
  prettyUrls: true,
});

// Source filtering — keep the build surface small. We process docs/ + the root
// index page + layouts; everything else (plugin scaffolding, repo plumbing,
// CI config) is excluded so it doesn't bleed into the output.
site.ignore(
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  ".github",
  ".claude",
  ".claude-plugin",
  ".gitignore",
  "plugins",
  "node_modules",
  "deno.json",
  "deno.jsonc",
  "deno.lock",
  "dist",
);

// Default layout for every markdown page. Per-directory or per-page frontmatter
// can override.
site.data("layout", "layouts/page.vto");

// Static asset: the single stylesheet.
site.add("styles.css");

// Pull the H1 of each markdown file into `title` so layouts can render it in
// <title> and breadcrumbs without us editing the canonical docs.
site.preprocess([".md"], (pages) => {
  for (const page of pages) {
    if (page.data.title) continue;
    const content = page.data.content;
    if (typeof content !== "string") continue;
    const match = content.match(/^#\s+(.+?)\s*$/m);
    if (match) page.data.title = match[1].trim();
  }
});

// Tag pages by section so the homepage and sidebars can list them.
site.preprocess([".md"], (pages) => {
  for (const page of pages) {
    const url = page.data.url;
    if (typeof url !== "string") continue;
    if (url.startsWith("/docs/playbooks/")) {
      page.data.section = "playbooks";
    } else if (url.startsWith("/docs/prompts/")) {
      page.data.section = "prompts";
    }
  }
});

site.use(code_highlight());
site.use(nav());

export default site;
