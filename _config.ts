import lume from "lume/mod.ts";
import base_path from "lume/plugins/base_path.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import nav from "lume/plugins/nav.ts";
import type { LanguageFn } from "lume/deps/highlight.ts";

// Minimal GDScript grammar — the Godot standards appendix uses ```gdscript
// blocks, and gdscript isn't in highlight.js's bundled language set (without
// this, the build errors with "Unknown language"). GDScript is Python-like.
const gdscript: LanguageFn = (hljs) => ({
  name: "GDScript",
  keywords: {
    keyword:
      "and as assert await break breakpoint class class_name const continue elif else enum extends for func if in is match not or pass preload return self signal static super tool var void while yield",
    literal: "true false null PI TAU INF NAN",
    built_in:
      "Vector2 Vector2i Vector3 Vector3i Color Rect2 Node Node2D Node3D Resource RefCounted Array Dictionary String StringName NodePath print push_error push_warning preload load range len str int float bool typeof",
  },
  contains: [
    hljs.HASH_COMMENT_MODE,
    { className: "string", begin: '"""', end: '"""' },
    hljs.QUOTE_STRING_MODE,
    hljs.APOS_STRING_MODE,
    hljs.C_NUMBER_MODE,
    { className: "meta", begin: "@[A-Za-z_]\\w*" },
    { className: "symbol", begin: "[$%][\\w/]+" },
  ],
});

// `deno task serve` sets LUME_DEV=1 so we can keep root-relative paths
// unprefixed during local development (the dev server mounts at `/`, not
// `/engineering-playbook/`). We can't sniff Deno.args for `-s` here because
// the Lume CLI consumes its own flags before this config file loads.
const isServing = Deno.env.get("LUME_DEV") === "1";

const site = lume({
  src: ".",
  dest: "dist",
  // GitHub Pages serves this site at https://sigmadigital.io/engineering-playbook/
  // (the org's sigmadigitalza.github.io repo has a CNAME for sigmadigital.io,
  // and GitHub serves all org-owned repos under that custom domain at the
  // /<repo-name>/ subpath). The base_path plugin reads the pathname from
  // `location` and rewrites every absolute href/src/srcset to prepend it,
  // so /styles.css in templates becomes /engineering-playbook/styles.css in
  // the rendered output.
  // During `deno task serve` we fall back to localhost so the dev server
  // works without the subpath prefix.
  location: new URL(
    isServing
      ? "http://localhost:3000/"
      : "https://sigmadigital.io/engineering-playbook/",
  ),
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

// Static assets: the stylesheet and the small copy-to-clipboard script.
site.add("styles.css");
site.add("copy.js");

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
    } else if (url.startsWith("/docs/standards/")) {
      page.data.section = "standards";
      // Spine first, then appendices in reading order.
      page.data.order = url.includes("/sigma-engineering-standards/")
        ? 0
        : url.includes("javascript-typescript")
        ? 1
        : url.includes("golang")
        ? 2
        : url.includes("android-kotlin")
        ? 3
        : url.includes("godot")
        ? 4
        : 5;
    }
  }
});

site.use(code_highlight({ languages: { gdscript } }));
site.use(nav());

// Rewrite intra-repo `.md` links (the standards docs cross-link each other with
// `.md` paths so they resolve on GitHub) to their built pretty-URL form, so they
// don't 404 on the site. Emits absolute site-root URLs; base_path (below) then
// prefixes them. Runs before base_path so it sees the pre-prefixed URLs.
site.process([".html"], (pages) => {
  const urlBySource = new Map<string, string>();
  for (const page of pages) {
    if (typeof page.data.url === "string") {
      urlBySource.set(page.src.path + page.src.ext, page.data.url);
    }
  }
  for (const page of pages) {
    const { document } = page;
    if (!document) continue;
    const from = "file://" + page.src.path + page.src.ext;
    for (const anchor of document.querySelectorAll("a[href]")) {
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("/") || href.startsWith("#")) continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue; // external scheme
      const [path, hash] = href.split("#");
      if (!path.endsWith(".md")) continue;
      const target = new URL(path, from).pathname;
      const url = urlBySource.get(target);
      if (url) anchor.setAttribute("href", hash ? `${url}#${hash}` : url);
    }
  }
});

// base_path must come last so it sees the URLs that other plugins emitted.
// Skip it during `deno task serve` — the dev server mounts at `/` so the
// subpath prefix is not needed (and would break local navigation).
if (!isServing) {
  site.use(base_path());
}

export default site;
