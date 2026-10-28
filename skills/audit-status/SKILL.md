---
name: audit-status
description: Read-only progress report for the audit and remediation pipeline. Reads .tmp/audit/audit_state.json and .tmp/fix/fix_state.json and prints module progress, verified findings by severity, queue state, and any state-file inconsistencies. Use when asking "where is the audit", "what is left", or before resuming an interrupted pipeline.
---

# Audit status

Report where the pipeline stands. **Read-only**: never mutate state files, source files, or git history; never run tests.

## Arguments

Any arguments are ignored.

## Steps

1. Read `.tmp/audit/audit_state.json` and `.tmp/fix/fix_state.json` if they exist.
2. If neither exists, reply in under five lines: no audit state in this workspace, and the first command to run is `audit-init`. Stop.
3. From `modules[]`, compute modules by domain (done/total), verified findings by severity, and the next queued module (first `PENDING`, else first `IN_PROGRESS`, else none).
4. If a fix queue exists, report total, done, blocked, skipped, and the active fix id and severity.
5. Flag inconsistencies instead of hiding them:
   - `total_modules` differs from `modules.length`;
   - `current_module_index` out of range;
   - a module is `COMPLETED` with `findings_count > 0` but has no report in `.tmp/audit/findings/`;
   - `status: SYNTHESIS_READY` while `PENDING` modules remain.
6. If a state file has not changed in more than 24 hours, say so in one line.

## Output

At most 12 lines, no tables:

```
project | status | audit 3/12 modules | 7 findings (2C/3H/2M)
domains: backend 3/7 | frontend 0/5 | core 0/2
fix queue: 5 total | 2 done | 1 blocked | next DEFECT-3 (High)
next: audit-next   (or audit-final, or fix-init)
```

Map the next command from the state: `SYNTHESIS_READY` means `audit-final`; all modules done with `FINAL_AUDIT_REPORT.md` present but no fix queue means `fix-init`; `ALL_FIXES_COMPLETED` means the pipeline is finished and the commit log is the deliverable.
