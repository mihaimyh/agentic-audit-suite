# Writing skills for this kit

The repository ships one canonical format: an [Agent Skills](https://agentskills.io) folder per workflow. Hosts differ in paths and invocation, never in content.

## File shape

```
skills/<name>/
└── SKILL.md
```

Optional supporting files are allowed (`references/`, `scripts/`, `assets/`) but must be referenced from `SKILL.md`, because hosts only load what the body points at.

## Frontmatter

```yaml
---
name: audit-next
description: One sentence on what it does, then exactly when to use it. Front-load trigger words; hosts truncate long lists.
---
```

Enforced by `npm test`:

| Rule | Reason |
| :--- | :--- |
| `name` equals the folder name | Copilot silently drops skills whose name does not match its folder |
| lowercase, digits, hyphens, max 64 chars | Slash-command grammars in every host |
| `description` under 1,024 chars | Host-side truncation limit |
| no `$ARGUMENTS`, `$1` … | Only two hosts substitute them; the rest would show the literal token |
| no `subagent`, `model`, `allowed-tools` | Host-specific fields that other hosts ignore or reject |
| LF endings, no absolute paths | Windows checkouts and portable installs |

## Body contract

1. **Say what to do, not why the skill exists.** Rationale belongs in the README.
2. **Declare an `## Arguments` section in prose.** The text after the command is the input; state what happens when it is empty.
3. **State the output contract.** How long the chat reply is, and which file holds the detail.
4. **Make evidence mandatory.** If a step claims a defect, the body must demand a reproduction that fails first.
5. **Guard destructive steps.** Require an explicit confirmation token before deleting or committing.
6. **Stay host-neutral.** No pronouns for the tool, no "ask the user to click", no assumptions about model choice.
7. **Keep the body under ~120 lines.** Every host pays for it in context; long skills get summarised and lose constraints.

## Anti-patterns rejected in review

- A skill that only restates "review the code carefully".
- A checklist with no verification step, so the agent can claim a finding without evidence.
- Instructions that depend on a previous conversation turn.
- Duplicated skill content: if two skills share rules, extract them into the body of each (hosts do not compose skills) or accept the duplication deliberately and keep it identical.
- Personal defaults (language, tone, comment style) baked in as universal requirements.

## Testing a change

```bash
npm test
node bin/cli.mjs install --dry-run
node bin/cli.mjs install --skills <name> --link
```

With `--link`, edits in this repository are live in your agent, so you can iterate without reinstalling.
