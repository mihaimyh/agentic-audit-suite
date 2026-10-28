# Contributing

Thanks for taking the time. This repository holds prompt assets, so review is about **precision and evidence**, not code style.

## Ground rules

1. `npm test` must pass. It validates frontmatter, naming, portability rules and required skills.
2. A new skill needs a workflow you actually ran at least once, on a real repository, with real output.
3. No host-specific syntax. If a feature exists only in one host, it does not belong in `skills/`.
4. Keep the body under ~120 lines. If it needs more, split it into two skills or move reference material into `docs/`.

## Adding a skill

```bash
mkdir -p skills/my-skill
$EDITOR skills/my-skill/SKILL.md
npm test
node bin/cli.mjs install --skills my-skill --dry-run
```

Then add the skill to:

- the table in `README.md`;
- `REQUIRED_SKILLS` in `scripts/validate.mjs` if the suite cannot work without it;
- `CHANGELOG.md` under `Unreleased`.

## Changing an existing skill

- Preserve the output contract unless the change is the point of the PR.
- If you change the state schema, update `docs/pipeline.md` and the guard logic in the affected skills in the same PR.
- Behaviour changes that make a skill stricter are welcome without discussion; changes that make it looser need a rationale in the PR description.

## Commits

Conventional Commits, imperative mood, scoped by area:

```
feat(skill): add dependency-audit
fix(install): keep existing skill folders unless --force
docs(portability): correct Antigravity global path
```

## Pull requests

- One concern per PR.
- Describe the failure mode the change prevents, not just the change.
- Paste the `npm test` output.

## Reporting issues

Use the templates. For a broken skill, include the host and version, the exact command, and the raw output. Redact secrets and private code.
