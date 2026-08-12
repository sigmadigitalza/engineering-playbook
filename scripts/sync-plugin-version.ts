/**
 * sync-plugin-version.ts — mirror the release version from the manifest
 * (deno.json) into the Claude Code plugin manifest (plugin.json), so the
 * plugin's own version tracks each release instead of drifting.
 *
 * Wired into prepare-release's `post-mirror-tasks` (which runs *after* the
 * deno.json bump), with plugin.json listed in `commit-paths`, so the synced
 * version lands in the same release PR. CI runs the `--check` mode to fail on
 * drift.
 *
 * Run
 * ---
 *   deno task sync:plugin-version         # write plugin.json to match deno.json
 *   deno task sync:plugin-version:check   # verify only, non-zero exit on drift
 */

import { dirname, fromFileUrl, join } from "jsr:@std/path@^1";

const REPO_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const MANIFEST = join(REPO_ROOT, "deno.json");
const PLUGIN_MANIFEST = join(
  REPO_ROOT,
  "plugins",
  "sigma-engineering",
  ".claude-plugin",
  "plugin.json",
);

function readVersion(path: string): string {
  const v = JSON.parse(Deno.readTextFileSync(path))?.version;
  if (typeof v !== "string") {
    throw new Error(`no string "version" field in ${path}`);
  }
  return v;
}

function main(): void {
  const check = Deno.args.includes("--check");
  const target = readVersion(MANIFEST);
  const text = Deno.readTextFileSync(PLUGIN_MANIFEST);
  const current = readVersion(PLUGIN_MANIFEST);

  if (current === target) {
    console.log(`plugin.json already at ${target}`);
    return;
  }

  if (check) {
    console.error(
      `\n✗ plugin.json version (${current}) is out of sync with deno.json (${target}).\n  Run \`deno task sync:plugin-version\`.\n`,
    );
    Deno.exit(1);
  }

  // Replace only the top-level "version" line (two-space indent) so a nested
  // "version" elsewhere in the manifest can't be hit, and nothing else is
  // reformatted.
  const next = text.replace(/^( {2}"version"\s*:\s*)"[^"]*"/m, `$1"${target}"`);
  if (next === text) {
    throw new Error(
      `could not find a top-level "version" line to update in ${PLUGIN_MANIFEST}`,
    );
  }
  Deno.writeTextFileSync(PLUGIN_MANIFEST, next);
  console.log(`plugin.json: ${current} -> ${target}`);
}

if (import.meta.main) {
  main();
}
