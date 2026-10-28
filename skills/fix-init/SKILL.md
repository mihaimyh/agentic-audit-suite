---
name: fix-init
description: Build an ordered, atomic remediation queue from verified audit findings. Reads .tmp/audit/findings and FINAL_AUDIT_REPORT.md, filters Critical/High/Medium defects, splits multi-file defects into surgical entries, and writes .tmp/fix/fix_state.json ordered Critical first. Use after the audit synthesis, before fixing anything.
---

# Remediation initialization

You are a Principal Software Reliability Engineer preparing a zero-regression remediation pipeline. **Do not fix anything in this turn.**

## Arguments

Any arguments are ignored.

## Severity definitions

- **Critical**: direct data corruption, wire or serialisation data loss, phantom state mutation, active security or authentication bypass, complete loss of paid entitlements.
- **High**: deterministic race conditions, unhandled crashes on active execution paths, cross-user state or idempotency leaks, silent error swallowing.
- **Medium**: unbounded memory growth, sub-optimal retry or caching, missing cleanup on edge cases, telemetry inaccuracy.

## Steps

### 1. Guard

If `.tmp/fix/fix_state.json` exists and its status is not `ALL_FIXES_COMPLETED`, stop and report total, completed, blocked, and active index. Offer `fix-next` to resume or `audit-reset confirm fix` to rebuild the queue. Never silently overwrite recorded commit hashes.

### 2. Ingest

Read `.tmp/audit/findings/*.md` and `FINAL_AUDIT_REPORT.md` when present. Ingest only verified Critical, High, and Medium findings. Exclude `UNVERIFIED` items and list them as excluded, with the reason.

Split multi-file defects into discrete entries when they touch independent modules or adapters, so each fix stays surgical and atomic.

### 3. Prepare and write

Ensure `.tmp/fix/` exists and `.tmp/` is git-ignored. Then write `.tmp/fix/fix_state.json`:

```json
{
  "status": "IN_PROGRESS",
  "current_fix_index": 0,
  "total_fixes": 0,
  "fixes": [
    {
      "id": "DEFECT-ID",
      "finding_ref": "F1",
      "module": "module_id",
      "domain": "backend",
      "language": "detected_language",
      "severity": "Critical",
      "status": "PENDING",
      "summary": "1-sentence defect summary",
      "target_file": "path/to/source.ext",
      "regression_test_file": "path/to/test_file.ext",
      "test_cmd": "exact command to run the regression test with race or sanitizer flags",
      "suite_cmd": "exact command to run the domain suite and static analyzer",
      "commit_hash": null
    }
  ]
}
```

Rules:

- per-fix `status` is one of `PENDING`, `IN_PROGRESS`, `COMPLETED`, `COMPLETED_UNVERIFIED`, `BLOCKED`, `SKIPPED`;
- order strictly `Critical`, then `High`, then `Medium`; inside a severity, cheapest-risk-first (smaller blast radius, fewer files);
- `total_fixes` equals `fixes.length`, `current_fix_index` starts at 0;
- if `git rev-parse --is-inside-work-tree` fails, still build the queue and add `"commit_mode": "none"` at the top level.

Stop after writing. Nothing in source is modified, nothing is committed.

## Output

1. Queue table: `# | ID | Severity | Module | Target file | Test command`, Critical rows first and explicitly marked.
2. Counts by severity, plus the excluded `UNVERIFIED` count.
3. The state path and the next action: `fix-next`.
