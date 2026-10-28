---
name: audit-final
description: Synthesize a completed codebase audit into FINAL_AUDIT_REPORT.md. Aggregates module findings, audits cross-module boundaries (wire contracts, state desync, layering, trust boundaries), runs the global test baseline, and produces a severity-ordered bug table, roadmap, and PR plan. Use when every module is audited and audit_state.json reports SYNTHESIS_READY.
---

# Audit synthesis

You are the Principal Systems Architect running the final pass. Verified findings live in `.tmp/audit/findings/*.md`.

## Arguments

If the text after the command contains `no-pr-plan`, skip section 8 of the report. Otherwise ignore it.

## Rules

1. **Verified only.** A bug enters the master table only if its reproduction was run and failed against HEAD. `UNVERIFIED` observations go into a separate appendix.
2. Every row carries a `file:line` anchor and the exact reproduction command.
3. Chat output under 15 lines; all detail goes to the report.
4. Reply in the user's language; report body in English.
5. State the audit coverage (modules audited versus discovered) in the report header. A partial audit is still a result, but it must be visible.

## Steps

### 1. Ingest

- Read every `.tmp/audit/findings/*.md` and `.tmp/audit/audit_state.json`.
- Confirm no module was skipped; if one was, say so explicitly.
- Run each domain's full test suite and static analyzer to capture a global baseline: total tests, passing/failing, analyzer status, duration.

### 2. Cross-module and boundary review

Audit the seams isolation cannot see. One finding per real defect, prefixed `X1`, `X2`, ...:

- **Wire and schema contracts.** Compare API or schema contracts (REST, GraphQL, gRPC/Protobuf, JSON schema) against persistence models and client types. Look for case-sensitivity mismatches, unmapped enum values, nullability drift, and silent field drops on round-trip.
- **State and concurrency desynchronisation.** When a transition happens in one module (sign-out, permission revocation, tier change, cache invalidation), do downstream modules and in-flight workers invalidate deterministically?
- **Layering and dependency inversion.** Do core or storage packages import transport, presentation, or UI layers?
- **Security and trust boundaries.** Are authorization claims, tenant boundaries, or rate-limit identities taken from unverified client input instead of authoritative server state?

### 3. Write `FINAL_AUDIT_REPORT.md` at the project root

1. **Executive summary and stack overview**: architectural health, domains and runtimes, headline verified risks, audit coverage.
2. **Subsystem and feature catalog**: directory breakdown by domain plus an ASCII dependency graph.
3. **Cross-boundary review**: the `X*` findings.
4. **Master critical bugs table** (`F1`, `F2`, ...) ordered by severity:
   - **Critical**: data corruption, wire deserialisation drops, phantom state mutations, active security or tenant bypass, loss of paid entitlements.
   - **High**: deterministic races, unhandled crash paths, cross-user state leaks, silent error swallowing.
   - **Medium**: unbounded memory growth, sub-optimal retry or caching, unpruned collections.
   Each row: root cause, `file:line`, reproduction command, minimal unified diff.
5. **Algorithmic and scalability bottlenecks**: multi-scale benchmark tables, Big-O, proposed replacement.
6. **Phased roadmap**: Phase 1 (Critical and High, fix now) covers correctness, wire drops, and isolation. Phase 2 (Medium, backlog) covers algorithms, pruning, and test blind spots.
7. **What not to change**: three to five pragmatic decisions that work and must be preserved to avoid needless risk.
8. **PR plan** (unless skipped): group fixes into reviewable units, one PR per module or per cross-boundary cluster, each with a Conventional Commits title, the finding IDs it closes, the test files it touches, and its dependencies on other PRs. Order by severity, then by merge risk.
9. **Appendix: UNVERIFIED**: findings without a reproduction, and why.

### 4. Close the phase

- Set `"status": "COMPLETED"` in `.tmp/audit/audit_state.json`.
- Do not delete `.tmp/audit/findings/`: the remediation commands read the root causes from there.
- Print both cleanup commands for later:

```bash
rm -rf .tmp/audit
```

```powershell
Remove-Item -Recurse -Force .tmp/audit
```

## Output

1. Report path, verified counts by severity, `X*` count.
2. Top three headline risks, one line each.
3. PR plan: number of PRs and the first one.
4. State `COMPLETED` and the next action: `fix-init`.
