/**
 * link-agents.ts — symlink every plugin skill's agent definition into
 * `.claude/agents/` so the agents are dispatchable in a local Claude Code
 * session.
 *
 * `.claude/` is gitignored, so these links are a per-checkout convenience, not a
 * committed artefact — re-run this after cloning, after switching worktrees, or
 * whenever a new skill adds agents. The canonical agent files live in each
 * skill's own `agents/` directory; this only points at them.
 *
 * Idempotent: re-running replaces existing links in place and never touches a
 * regular file.
 *
 * Run
 * ---
 *   deno task link:agents
 *   # or directly:
 *   deno run --allow-read --allow-write scripts/link-agents.ts
 */

import { dirname, fromFileUrl, join, relative } from "jsr:@std/path@^1";
import { ensureDir, expandGlob } from "jsr:@std/fs@^1";

const REPO_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const AGENTS_DIR = join(REPO_ROOT, ".claude", "agents");
const AGENT_GLOB = "plugins/*/skills/*/agents/*.md";

async function main(): Promise<void> {
  await ensureDir(AGENTS_DIR);

  let linked = 0;
  const seen = new Map<string, string>();
  for await (const entry of expandGlob(AGENT_GLOB, { root: REPO_ROOT })) {
    if (!entry.isFile) continue;

    // Two skills shipping an agent of the same name would collide in the flat
    // `.claude/agents/` namespace — fail loudly rather than link one over the
    // other.
    const prior = seen.get(entry.name);
    if (prior) {
      console.error(
        `✗ Agent name collision: ${entry.name}\n    ${prior}\n    ${entry.path}\n  Rename one before linking.`,
      );
      Deno.exit(1);
    }
    seen.set(entry.name, entry.path);

    const linkPath = join(AGENTS_DIR, entry.name);
    // Relative target so the link resolves the same in the main checkout and in
    // any worktree.
    const target = relative(AGENTS_DIR, entry.path);

    try {
      const stat = await Deno.lstat(linkPath);
      if (stat.isSymlink) {
        await Deno.remove(linkPath);
      } else {
        console.error(
          `✗ ${linkPath} exists and is not a symlink — leaving it untouched.`,
        );
        continue;
      }
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;
    }

    await Deno.symlink(target, linkPath);
    linked++;
    console.log(`  ${entry.name} -> ${target}`);
  }

  console.log(`Linked ${linked} agent(s) into .claude/agents/`);
}

if (import.meta.main) {
  await main();
}
