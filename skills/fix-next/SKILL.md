---
name: fix-next
description: Fix exactly one queued defect with TDD and an atomic local commit. Writes a regression test that fails on current code, applies the minimal patch, re-runs with race or sanitizer flags, gates on the domain suite and analyzer, then commits only the touched files. Never pushes. Use after fix-init, one defect per turn.
---

# Zero-regression fix

You are an elite Staff Software Engineer executing one surgical fix from `.tmp/fix/fix_state.json`.

## Arguments

- empty: the fix at `current_fix_index`;
- a fix `id` or `finding_ref`: that defect, keeping state consistent;
- `no-commit`: run the whole protocol but leave the change uncommitted.

## Rules

1. **Surgical precision.** Modify only the lines required. No reformatting, no renames, no refactors outside the failure path.
2. **No silent error swallowing.** Teardown and recovery blocks use idiomatic completion (`finally`, `whenComplete`, `defer`, `using`) or explicitly rethrow.
3. **Production-grade tests.** Accept the fix only after a permanent regression test covering the real failure mode passes.
4. **Atomic local commits.** Never `git add .` or `git add -A`. Never `git push`. Never amend, rebase, or force-push. Stage only the target file and the regression test.
5. Under 15 lines of chat plus the diff; detail goes to the state file and commit message.

## Steps

### 1. Resolve state and tooling

Read `.tmp/fix/fix_state.json`. If missing, tell the user to run `fix-init` and stop. Select the fix at `current_fix_index` whose status is `PENDING` or `IN_PROGRESS`; skip `COMPLETED`, `COMPLETED_UNVERIFIED`, `BLOCKED`, and `SKIPPED`. If none remain, set `"status": "ALL_FIXES_COMPLETED"`, write it, report the commit list, and stop.

Read the defect root cause and proposed diff from `.tmp/audit/findings/<module>.md` or `FINAL_AUDIT_REPORT.md`.

### 2. Red phase: permanent regression test

Create or update `regression_test_file`. Design it to fail on unpatched code under realistic conditions:

- **Concurrency stress**: 50-100 concurrent workers, threads, or coroutines released by a barrier or latch on the shared path.
- **Boundary and fault injection**: zero-values, empty collections, sub-second intervals, malformed payloads, simulated I/O failure.
- **Determinism**: no sleeps as synchronisation, no wall-clock dependence, bounded runtime.

Run `test_cmd` and confirm it fails against current code. A test that passes before the fix is not a regression test; calibrate it.

If the failure cannot be reproduced after **three distinct attempts**, mark the fix `BLOCKED` with `blocked_reason` (what was attempted, the command, the outcome), advance `current_fix_index` to the next `PENDING` fix, save, and report. The original finding may be wrong; say so plainly.

### 3. Green phase: minimal patch

Apply the smallest change to `target_file`, then re-run `test_cmd` with race or sanitizer flags and multiple iterations where the ecosystem supports it. Confirm a clean pass with no race warnings, repeating three times for concurrency tests.

### 4. Suite gate

Run `suite_cmd` (domain suite plus static analyzer). Requirement: passing count increased, nothing previously green broke, analyzer clean for touched files. If the gate fails, revert the patch, mark `BLOCKED` with the failing output, and stop.

### 5. Atomic commit

Skip when `no-commit` is given or the workspace is not a git repository.

1. Run `git status --porcelain` and confirm only intended changes are present. Never stage user changes you did not make.
2. `git add <target_file> <regression_test_file>`, listing every touched file explicitly.
3. Write the message to `.tmp/fix/commit-msg.txt` (avoids shell quoting problems on PowerShell):

```
fix(<module>): <summary> (<id>)

Resolves finding <finding_ref> (<id>).
Adds regression test in <regression_test_file>.
```

4. `git commit -F .tmp/fix/commit-msg.txt`
5. `git rev-parse --short HEAD` and store it as `commit_hash`.

Outside a git repository, record `"commit_hash": null` and set `COMPLETED_UNVERIFIED` if the suite gate could not run, otherwise `COMPLETED`.

### 6. Advance state

Mark the fix `COMPLETED` (or `COMPLETED_UNVERIFIED`), store the hash, and move `current_fix_index` to the next `PENDING` fix or `fixes.length`. Keep `"status": "IN_PROGRESS"` while fixes remain, otherwise `ALL_FIXES_COMPLETED`.

## Output

1. **Fixed**: id, finding ref, severity, `file:line`.
2. **Commit**: short SHA, or `uncommitted` / `no git repository`.
3. **Root cause resolved**: one or two sentences.
4. **Evidence**: red-phase command and failure line, green-phase command and pass line, suite result.
5. **Unified diff** of the patch.
6. **Next**: the next queued fix id, or completion plus `audit-status`.
