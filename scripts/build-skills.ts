/**
 * build-skills.ts — single source for both Claude Code plugin skills and
 * GitHub Copilot instructions, derived from `docs/playbooks/` + `docs/prompts/`.
 *
 * Idempotent: running it again after new playbooks land updates everything in
 * place without churning unrelated files.
 *
 * Inputs
 * ------
 *  - docs/playbooks/<name>.md   : human playbook (verbatim → playbook.md)
 *  - docs/prompts/<name>.md     : LLM-ready prompt (body → SKILL.md and Copilot instructions.md)
 *  - scripts/skills-meta.json   : per-skill metadata (description, optional applyTo)
 *
 * Outputs
 * -------
 *  - plugins/sigma-engineering/skills/<name>/SKILL.md
 *  - plugins/sigma-engineering/skills/<name>/playbook.md
 *  - .github/instructions/<name>.instructions.md
 *
 * Run
 * ---
 *   deno task build:skills
 *   # or directly:
 *   deno run --allow-read --allow-write scripts/build-skills.ts
 *   # dry run (report only):
 *   deno run --allow-read scripts/build-skills.ts --check
 */

import { dirname, join, relative } from "jsr:@std/path@^1";
import { ensureDir } from "jsr:@std/fs@^1";

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const PROMPTS_DIR = join(REPO_ROOT, "docs", "prompts");
const PLAYBOOKS_DIR = join(REPO_ROOT, "docs", "playbooks");
const META_FILE = join(REPO_ROOT, "scripts", "skills-meta.json");
const PLUGIN_SKILLS_DIR = join(
  REPO_ROOT,
  "plugins",
  "sigma-engineering",
  "skills",
);
const COPILOT_DIR = join(REPO_ROOT, ".github", "instructions");

const REFERENCE_LINE =
  "**Reference**: The full Sigma Digital playbook is in `playbook.md` next to this file. Load it for the complete checklist, threat model, and rationale behind each check.";

interface SkillMeta {
  description: string;
  applyTo?: string;
}

interface MetaFile {
  skills: Record<string, SkillMeta>;
}

interface ChangeReport {
  added: string[];
  changed: string[];
  unchanged: string[];
}

function readJson<T>(path: string): T {
  return JSON.parse(Deno.readTextFileSync(path)) as T;
}

function listMarkdownBasenames(dir: string): Set<string> {
  const set = new Set<string>();
  for (const entry of Deno.readDirSync(dir)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      set.add(entry.name.replace(/\.md$/, ""));
    }
  }
  return set;
}

/**
 * Strip the prompt preamble (title + "Paste into Claude Code…" line) and
 * return everything after the first `---` separator.
 *
 * Example input:
 *   # Foo Review Prompt
 *
 *   Paste into Claude Code, run from the repo root.
 *
 *   ---
 *
 *   You are a senior …
 *
 * Output: `You are a senior …` (with leading blank line trimmed).
 */
function extractPromptBody(promptText: string): string {
  const idx = promptText.indexOf("\n---\n");
  if (idx === -1) {
    throw new Error(
      "prompt has no `---` separator after the preamble (expected `# Title\\n\\nPaste into Claude Code…\\n\\n---\\n\\nYou are a …`)",
    );
  }
  let body = promptText.slice(idx + "\n---\n".length);
  // Drop a single leading blank line if present.
  body = body.replace(/^\n/, "");
  return body;
}

function buildSkillMd(name: string, meta: SkillMeta, body: string): string {
  // YAML frontmatter: `description` is the only field that matters for
  // auto-trigger matching. We intentionally write it inline (not folded) so
  // the diff stays human-readable when descriptions are tweaked.
  return [
    "---",
    `name: ${name}`,
    `description: ${meta.description}`,
    "---",
    "",
    REFERENCE_LINE,
    "",
    body,
  ].join("\n");
}

function buildCopilotInstructionsMd(
  meta: SkillMeta,
  body: string,
): string {
  // GitHub Copilot custom instructions format:
  //   ---
  //   description: "..."
  //   applyTo: "**"
  //   ---
  //   <body>
  //
  // `applyTo` defaults to "**" — instructions are always available for
  // description-matching. Per-skill overrides come from skills-meta.json
  // (e.g., github-actions-review narrows to .github/**).
  const applyTo = meta.applyTo ?? "**";
  return [
    "---",
    // Quote both fields — Copilot's frontmatter parser is YAML, and unquoted
    // values containing colons/commas/em-dashes are footguns.
    `description: ${JSON.stringify(meta.description)}`,
    `applyTo: ${JSON.stringify(applyTo)}`,
    "---",
    "",
    body,
  ].join("\n");
}

async function writeIfChanged(
  path: string,
  content: string,
  report: ChangeReport,
  check: boolean,
): Promise<void> {
  let existing: string | null = null;
  try {
    existing = await Deno.readTextFile(path);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }

  const rel = relative(REPO_ROOT, path);
  if (existing === content) {
    report.unchanged.push(rel);
    return;
  }
  if (existing === null) {
    report.added.push(rel);
  } else {
    report.changed.push(rel);
  }
  if (check) return;

  await ensureDir(dirname(path));
  await Deno.writeTextFile(path, content);
}

async function main(): Promise<void> {
  const args = new Set(Deno.args);
  const check = args.has("--check");

  const metaFile = readJson<MetaFile>(META_FILE);
  const prompts = listMarkdownBasenames(PROMPTS_DIR);
  const playbooks = listMarkdownBasenames(PLAYBOOKS_DIR);

  // Categorise.
  const matched: string[] = [];
  const promptOnly: string[] = [];
  const playbookOnly: string[] = [];
  for (const name of new Set([...prompts, ...playbooks])) {
    const hasPrompt = prompts.has(name);
    const hasPlaybook = playbooks.has(name);
    if (hasPrompt && hasPlaybook) matched.push(name);
    else if (hasPrompt) promptOnly.push(name);
    else playbookOnly.push(name);
  }
  matched.sort();
  promptOnly.sort();
  playbookOnly.sort();

  // Validate metadata coverage.
  const missingMeta: string[] = [];
  const extraMeta: string[] = [];
  for (const name of matched) {
    if (!metaFile.skills[name]) missingMeta.push(name);
  }
  for (const name of Object.keys(metaFile.skills)) {
    if (!matched.includes(name)) extraMeta.push(name);
  }

  if (missingMeta.length) {
    console.error(
      `\n✗ Missing metadata in scripts/skills-meta.json for:\n  ${
        missingMeta.join(", ")
      }\n  Add a description before re-running.\n`,
    );
    Deno.exit(2);
  }

  if (extraMeta.length) {
    console.warn(
      `\n⚠ Metadata in scripts/skills-meta.json without a matching pair in docs/:\n  ${
        extraMeta.join(", ")
      }\n  Remove the entry or add the missing playbook + prompt.\n`,
    );
  }

  if (playbookOnly.length) {
    console.warn(
      `\n⚠ Playbook-only (no prompt) — skipped, can't generate a skill:\n  ${
        playbookOnly.join(", ")
      }\n`,
    );
  }

  // Generate.
  const report: ChangeReport = { added: [], changed: [], unchanged: [] };

  for (const name of matched) {
    const meta = metaFile.skills[name];
    const promptText = await Deno.readTextFile(
      join(PROMPTS_DIR, `${name}.md`),
    );
    const playbookText = await Deno.readTextFile(
      join(PLAYBOOKS_DIR, `${name}.md`),
    );
    const body = extractPromptBody(promptText);

    const skillMd = buildSkillMd(name, meta, body);
    const copilotMd = buildCopilotInstructionsMd(meta, body);

    await writeIfChanged(
      join(PLUGIN_SKILLS_DIR, name, "SKILL.md"),
      skillMd,
      report,
      check,
    );
    await writeIfChanged(
      join(PLUGIN_SKILLS_DIR, name, "playbook.md"),
      playbookText,
      report,
      check,
    );
    await writeIfChanged(
      join(COPILOT_DIR, `${name}.instructions.md`),
      copilotMd,
      report,
      check,
    );
  }

  // Generate one prompt-only skill if any (Copilot only — no playbook).
  for (const name of promptOnly) {
    if (!metaFile.skills[name]) continue;
    const meta = metaFile.skills[name];
    const promptText = await Deno.readTextFile(
      join(PROMPTS_DIR, `${name}.md`),
    );
    const body = extractPromptBody(promptText);

    const skillMd = buildSkillMd(name, meta, body);
    const copilotMd = buildCopilotInstructionsMd(meta, body);

    await writeIfChanged(
      join(PLUGIN_SKILLS_DIR, name, "SKILL.md"),
      skillMd,
      report,
      check,
    );
    await writeIfChanged(
      join(COPILOT_DIR, `${name}.instructions.md`),
      copilotMd,
      report,
      check,
    );
  }

  // Report.
  const verb = check ? "would" : "will";
  console.log(`Skills:   ${matched.length} matched pair(s)`);
  if (promptOnly.length) {
    console.log(
      `          ${promptOnly.length} prompt-only (no playbook): ${
        promptOnly.join(", ")
      }`,
    );
  }
  if (playbookOnly.length) {
    console.log(
      `          ${playbookOnly.length} playbook-only (skipped): ${
        playbookOnly.join(", ")
      }`,
    );
  }
  console.log(`Added:    ${report.added.length} ${verb} be created`);
  for (const f of report.added) console.log(`          + ${f}`);
  console.log(`Changed:  ${report.changed.length} ${verb} be rewritten`);
  for (const f of report.changed) console.log(`          ~ ${f}`);
  console.log(`Unchanged: ${report.unchanged.length}`);

  if (check && (report.added.length || report.changed.length)) {
    console.error(
      "\n✗ Generated artefacts are out of sync with docs/ + skills-meta.json. Run `deno task build:skills`.\n",
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
