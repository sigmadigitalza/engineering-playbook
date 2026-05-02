# GitHub Copilot custom instructions

This directory holds the [Sigma Digital engineering playbooks][1] in GitHub Copilot's custom-instructions format. Each `<name>.instructions.md` file maps 1:1 to a playbook in `docs/playbooks/<name>.md` and a prompt in `docs/prompts/<name>.md`.

These files are read by Copilot Chat in your editor, Copilot Code Review, and Copilot Coding Agent. They auto-activate based on the `description` and `applyTo` glob in each file's frontmatter.

## Don't edit these directly

This directory is **generated** by `deno task build:skills` from `docs/prompts/`, `docs/playbooks/`, and `scripts/skills-meta.json`. Manual edits will be overwritten on the next regeneration. To change a skill:

- **Body / checklist** — edit `docs/prompts/<name>.md` (and the matching `docs/playbooks/<name>.md` if needed).
- **Description / `applyTo`** — edit `scripts/skills-meta.json`.
- Then run `deno task build:skills` to regenerate every skill (Claude plugin + Copilot instructions) in one pass.

The same generator emits `plugins/sigma-engineering/skills/<name>/SKILL.md` for the Claude Code / Claude Desktop plugin. Both formats stay byte-identical in body content; only the frontmatter schema differs.

## Using these in another repo

```bash
# Pull a single instruction file
curl -sLo .github/instructions/web-security.instructions.md \
  https://raw.githubusercontent.com/sigmadigitalza/engineering-playbook/main/.github/instructions/web-security.instructions.md

# Or sync the whole directory
gh repo clone sigmadigitalza/engineering-playbook /tmp/eng-pb
mkdir -p .github/instructions
cp /tmp/eng-pb/.github/instructions/*.instructions.md .github/instructions/
```

There is no marketplace for Copilot instructions — distribution is per-repo. For org-wide rollout, mirror this directory via a sync GitHub Action or include it in your repo template.

[1]: https://github.com/sigmadigitalza/engineering-playbook
