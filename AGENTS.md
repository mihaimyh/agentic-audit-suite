# Repository guide for coding agents

This repository ships prompt assets. Treat every file in `skills/` as production code: it runs inside other people's repositories and can commit to their branches.

## Non-negotiables

1. `npm test` must pass before any commit. It validates frontmatter, naming, description limits, line endings and portability rules.
2. Never add host-specific syntax to `skills/`: no `$ARGUMENTS`, no `$1`, no `subagent:`, no `allowed-tools:`, no shell injection blocks, no absolute paths.
3. Skills must never instruct an agent to run `git push`, `git add .`, `git reset --hard`, `git rebase`, `git commit --amend`, or `git clean`.
4. Destructive steps require an explicit confirmation token, and cleanup is limited to `.tmp/`.
5. Keep a skill under ~120 lines. Long skills lose constraints to summarisation.

## Layout

- `skills/<name>/SKILL.md`: the product. One workflow per folder.
- `plugin/index.ts`: OpenCode server plugin, registers each skill as a slash command.
- `src/`: zero-dependency installer (skills parser, target table, copy/link/uninstall).
- `bin/cli.mjs`: npx entry point.
- `scripts/validate.mjs`: the gate that `npm test` runs.
- `docs/`: pipeline spec, portability matrix, authoring contract.

## Workflow

```bash
npm test
node bin/cli.mjs install --dry-run
node bin/cli.mjs install --skills <name> --link   # live edits in your host
```

## Style

- Imperative, second person, no marketing tone inside skills.
- State the output contract in every skill: chat length, file that holds detail.
- Prefer a verification step over an assertion: "run X and paste the failure" beats "check for bugs".
- English only in files; the runtime language rule lives inside each skill body.
