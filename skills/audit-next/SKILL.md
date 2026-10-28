---
name: audit-next
description: Run one iteration of a running codebase audit on the next queued module. Reads .tmp/audit/audit_state.json, produces a failing reproduction for every claimed bug, benchmarks claimed bottlenecks across scales, writes the module findings report, and advances the state. Use after audit-init, repeatedly, until every module is complete.
---

# Audit iteration

You are a Principal Software Architect auditing exactly one module, driven strictly by live on-disk state.

## Arguments

The text after the command optionally selects what to audit:

- empty: the module at `current_module_index`;
- a module `id`: audit that module instead, and keep state consistent;
- anything else: ignore.

## Rules

1. **State is the only source of truth.** Read `.tmp/audit/audit_state.json`. Never rely on module names or indices from earlier conversation turns.
2. **No cosmetic bike-shedding.** Never report a refactor justified only by style, dogma, or syntax preference. Working code with negligible operational cost stays untouched.
3. **Evidence or silence.** Every finding cites an exact `file:line` and walks the failure sequence step by step.
4. **Clean tree.** Reproductions and benchmarks live in `.tmp/audit/repros/`. Never leave heavyweight or broken scripts inside the permanent test suite.
5. **Short chat output.** Under 15 lines in chat; the full table goes to the findings file.
6. **Reply language.** Match the user's last message. File contents stay in English.

## Steps

### 1. Resolve the module

- Read `.tmp/audit/audit_state.json`.
- If the module at `current_module_index` is already `"COMPLETED"`, advance to the first `"PENDING"` or `"IN_PROGRESS"` entry and rewrite the index.
- If every module is complete, set `"status": "SYNTHESIS_READY"`, write the file, and tell the user to run `audit-final`. Stop.

### 2. Context budget and dynamic split

If the module has more than roughly 25 source files, or reading it would exhaust the turn's context:

- split it in `audit_state.json` into 2-3 cohesive children (`<id>_a`, `<id>_b`, ...), each with its own `path`, `language`, `test_cmd`, and `status: "PENDING"`;
- replace the parent entry with the children and recompute `total_modules`;
- audit the first child now; the others join the queue;
- mention the split in the output.

### 3. Isolated module audit

Confine inspection to files under `path` plus their immediate tests and interfaces. Evaluate language idioms, concurrency mechanics, resource lifecycles (handles, connections, subscriptions, streams), unhandled errors, silent error swallowing, algorithmic scaling, and allocation hot spots.

**Defect verification (mandatory).** Every reported bug needs a standalone reproduction in `.tmp/audit/repros/` that uses public APIs and fails against current HEAD. Run it with the runner and flags from this module's `test_cmd`.

- If it passes, discard the finding immediately.
- Record the exact terminal command, the failing output, and a minimal unified diff.
- Teardown must use idiomatic completion (`finally`, `defer`, `whenComplete`, `using`) and never swallow errors.
- Severity is strictly `Critical` (data corruption, wire loss, phantom state, security or tenant bypass, lost entitlements), `High` (deterministic race, unhandled crash path, cross-user leak, silent error swallowing), or `Medium` (unbounded growth, sub-optimal retry or caching, missing cleanup, telemetry inaccuracy).

**Performance verification (mandatory).** A claimed bottleneck needs a multi-scale benchmark (`N=100`, `N=1,000`, `N=10,000`) proving super-linear growth, or empirical evidence of unbounded memory or resource retention. Constant or linear behaviour is reported as "no issue found".

**No usable test runner** (`test_cmd` is null or fails to execute): findings become `UNVERIFIED`, go in a separate report section, and are never counted as verified. Ask once for a working command; if the user declines, continue and mark the module `"COMPLETED_UNVERIFIED"`.

### 4. Record findings

Write `.tmp/audit/findings/<module_id>.md` with:

1. module overview and public exports;
2. verified bugs: ID, severity, root cause, `file:line`, reproduction command, failing output, minimal unified diff;
3. `UNVERIFIED` observations, if any;
4. benchmark table across scales, or "constant/linear - no issue";
5. **what works well and must not change** - one to three concrete items that protect proven design in later phases.

### 5. Advance state

- Mark this module `"COMPLETED"` (or `"COMPLETED_UNVERIFIED"`).
- Set `findings_count` to the verified count only.
- Set `current_module_index` to the next `"PENDING"` module, or `total_modules` when none remain.
- Keep `"status": "IN_PROGRESS"` while modules remain, otherwise `"SYNTHESIS_READY"`.

Do not commit anything during the audit phase.

## Output

1. Module audited: id, domain, path, files inspected.
2. Verified findings: counts by severity plus the three most severe (ID, one-line defect, `file:line`).
3. Benchmarks: verdict only, path to the table.
4. State: index/total, new status, next queued module.
5. One next action.
