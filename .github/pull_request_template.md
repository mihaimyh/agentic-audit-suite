## What this changes

<!-- One paragraph. Name the skill or file. -->

## Failure mode it prevents

<!-- What goes wrong today, and how a run proves the fix works. -->

## Checklist

- [ ] `npm test` passes
- [ ] No host-specific syntax added to `skills/` (`$ARGUMENTS`, `subagent:`, `allowed-tools:`, absolute paths)
- [ ] Destructive steps still require confirmation
- [ ] `README.md` table updated (new or renamed skill)
- [ ] `CHANGELOG.md` updated under `Unreleased`
- [ ] `scripts/validate.mjs` `REQUIRED_SKILLS` updated if the suite cannot work without this skill

## Verification output

```
paste npm test output here
```
