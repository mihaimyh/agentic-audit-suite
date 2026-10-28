---
name: audit-reset
description: Delete audit or remediation scratch state under .tmp/. Destructive and confirmation-gated, never touches git history or tracked files. Use to restart a pipeline cleanly, or to clear a corrupted audit_state.json or fix_state.json.
---

# Audit reset

Remove scratch state so a pipeline can restart cleanly. **Destructive**: require explicit confirmation and delete only paths under `.tmp/`.

## Arguments

- `confirm`: delete `.tmp/audit/` and `.tmp/fix/`.
- `confirm fix`: delete only `.tmp/fix/`.
- `confirm audit`: delete only `.tmp/audit/`.
- Anything else, or empty: dry run only. List what would be removed, then stop and ask for confirmation. Delete nothing.

## Steps

### 1. Inventory (always first)

List what would be removed, with sizes:

- `.tmp/audit/`: `audit_state.json`, findings count, reproduction count.
- `.tmp/fix/`: `fix_state.json`, completed/total fixes, recorded commit hashes.
- `.tmp/docs-audit/` and `.tmp/ux/`: only when present and covered by the argument.

### 2. Safety checks (always)

- If the fix queue is `"IN_PROGRESS"` and completed fixes carry `commit_hash`, warn that the commits stay in git, so a rebuilt queue would re-schedule already-fixed defects.
- `FINAL_AUDIT_REPORT.md` at the project root is a deliverable and is **not** deleted.
- Never run `git clean`, `git reset`, `git checkout`, or anything that touches working-tree files.

### 3. Dry run

Print the inventory in at most ten lines and end with: `Type "audit-reset confirm" to delete. Nothing was removed.`

### 4. Delete (only with confirmation)

Delete only the scoped paths, then verify each is gone. Report:

```
removed: .tmp/audit (12 findings, 34 repros) | .tmp/fix (8 fixes, 5 commits)
kept: FINAL_AUDIT_REPORT.md | all git history
next: audit-init
```

If a path did not exist, say "already absent" rather than implying it was removed.
