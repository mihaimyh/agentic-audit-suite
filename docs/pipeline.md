# The audit and remediation pipeline

## State machines

Everything is driven by two JSON files on disk. The chat is disposable; the state is not.

```
.tmp/audit/audit_state.json
  status: IN_PROGRESS ──► SYNTHESIS_READY ──► COMPLETED
  modules[]: PENDING ──► COMPLETED | COMPLETED_UNVERIFIED
```

```
.tmp/fix/fix_state.json
  status: IN_PROGRESS ──► ALL_FIXES_COMPLETED
  fixes[]: PENDING ──► IN_PROGRESS ──► COMPLETED | COMPLETED_UNVERIFIED
                                   └─► BLOCKED | SKIPPED
```

## Phase 1: initialization

`audit-init` partitions the repository by architectural boundary, not by directory listing. The sizing guardrail (5-20 files, 1k-3k LOC) is what keeps a module auditable inside one context window. It ends with a confirmation gate, because a wrong `test_cmd` multiplied by twenty modules produces twenty audits that prove nothing.

## Phase 2: iteration

One turn, one module. The rules that make the output trustworthy:

- **Reproduction or discard.** A bug that cannot be reproduced as a failing test against HEAD is not a finding. It may be an observation, filed under `UNVERIFIED`.
- **Benchmark or discard.** A performance claim needs three data points and a curve.
- **Protect what works.** Each report ends with one to three things that must not be changed, so later phases do not "fix" load-bearing design.

If a module is too large for one turn, `audit-next` splits it in the state file instead of producing a partial report. A silent partial is worse than a slower queue.

## Phase 3: synthesis

`synthesize` reads every report, runs the global baseline, and audits the seams isolation cannot see: wire contracts vs persistence models, state transitions vs in-flight workers, layer inversions, and trust boundaries. The output is `FINAL_AUDIT_REPORT.md`, which ends with a PR plan — a report nobody can execute is a report nobody reads.

## Phase 4: remediation

`fix-init` converts findings into an ordered queue: Critical, then High, then Medium, and inside a severity, the smallest blast radius first.

`fix-next` is strict TDD with a production-hardening bias:

1. the regression test must fail before the patch (red);
2. the patch is minimal (green);
3. the domain suite and analyzer must stay clean (gate);
4. only the touched files are committed (atomic).

Three failed reproduction attempts mark the defect `BLOCKED` and move on. One impossible defect must not stall the queue, and "cannot reproduce" is itself information: the original finding may be wrong.

## Why local commits and no push

The queue is a series of surgical changes. Keeping them local lets you review, reorder, squash, or revert them as one story. Pushing each fix to a shared branch turns a reviewable sequence into a race with CI and collaborators.

## Scratch layout

```
.tmp/audit/audit_state.json         queue and progress
.tmp/audit/findings/<module>.md     one report per module
.tmp/audit/repros/                  failing reproductions and benchmarks
.tmp/fix/fix_state.json             remediation queue
.tmp/fix/commit-msg.txt             message file used by git commit -F
.tmp/docs-audit/drift-report.md     documentation drift
.tmp/ux/<slug>.md                   product design reviews
FINAL_AUDIT_REPORT.md               deliverable, at the project root
```

`.tmp/` is added to `.gitignore` automatically on first use.
