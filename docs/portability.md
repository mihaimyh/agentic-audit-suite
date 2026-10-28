# Portability matrix

All six hosts converged on the [Agent Skills](https://agentskills.io) open standard. Only the directory and the invocation syntax differ.

## Where each host looks

| Host | Personal (global) | Project | Invocation |
| :--- | :--- | :--- | :--- |
| OpenAI Codex | `~/.agents/skills/` | `.agents/skills/` (walked up to the repo root) | `/skills`, or `$name` |
| Claude Code | `~/.claude/skills/` | `.claude/skills/`, nested per package | `/name` |
| Cursor | `~/.cursor/skills/`, `~/.agents/skills/`, `~/.claude/skills/` | `.cursor/skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/` | `/name` |
| GitHub Copilot (VS Code) | `~/.copilot/skills/`, `~/.claude/skills/`, `~/.agents/skills/` | `.github/skills/`, `.claude/skills/`, `.agents/skills/` | `/name` |
| Google Antigravity | `~/.gemini/config/skills/` | `.agents/skills/` (legacy `.agent/skills`) | `/name`, or name mention |
| OpenCode | `~/.config/opencode/skills/` | `.opencode/skills/` | `skill` tool / `/name` |

Because `~/.agents/skills/` is read natively by Codex, Cursor, Copilot and Antigravity, a single copy covers four hosts. The installer still writes dedicated directories where a host expects them, so nothing depends on compatibility shims.

## What stays identical

- **Frontmatter**: `name`, `description`. That is all six accept everywhere.
- **Body**: plain Markdown, imperative, no templating.
- **Arguments**: documented in prose. The text after the command is the input; each host passes it either natively or appended.
- **Safety rules**: no push, no `git add .`, confirmation-gated deletion.

## What is deliberately avoided

| Avoided | Why |
| :--- | :--- |
| `$ARGUMENTS`, `$1` | Substituted by two hosts only; literal text in the others |
| `subagent:`, `model:`, `allowed-tools:` frontmatter | Host-specific; ignored or rejected elsewhere |
| `allowed-tools` / permission grants | A skill should not silently widen its own permissions |
| Shell injection blocks (`` !`cmd` ``) | Executed by some hosts at load time, outside the permission flow |
| `@file` references | Not expanded from a stored skill in every host |
| Per-host duplicate copies of the prompts | Guaranteed drift |

## Known asymmetries

- **Claude Code plugins** namespace their skills: `/agentic-audit-suite:audit-next`. Install as plain skills if you want the short name.
- **OpenCode** skills are model-invoked; slash commands are a separate registry, so this kit also ships a server plugin and a generated-command fallback.
- **Copilot** shows skills as slash commands only when `user-invocable` is not `false`; this kit never sets it.
- **Codex** shows a compact skill list (2% of the context window by default) and shortens descriptions when many skills are installed. Keep descriptions short and trigger-heavy.
- **Antigravity** may still read `.agent/skills` in older builds; `.agents/skills` is the current default.

## Verifying an install

```bash
npx @mihaimyh/agentic-audit-suite doctor
npx @mihaimyh/agentic-audit-suite install --dry-run
```

Then ask the host for `/` completion, or run the cheapest skill end to end (`audit-status` on a repo with no state must answer in five lines).
