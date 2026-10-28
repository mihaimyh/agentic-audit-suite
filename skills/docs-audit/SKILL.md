---
name: docs-audit
description: Audit documentation against the real implementation and report drift. Inventories README files, docs folders and public exports, then flags missing APIs, phantom or renamed APIs, contract mismatches, broken snippets and config drift, with proposed unified diffs. Report-only unless the arguments contain "apply". Use when docs feel stale, before a release, or when onboarding exposes wrong examples.
---

# Documentation drift audit

You are a Staff Technical Writer and Systems Architect auditing documentation against actual implementation.

## Arguments

- `apply`: write the proposed documentation changes after the report, then re-verify examples.
- `apply <path>`: same, limited to that documentation path.
- a path without `apply`: scope the audit to that path, report only.
- empty: whole repository, report only.

## Rules

1. **Source code is the source of truth.** Never trust docs over implementation. Verify signatures, defaults, return shapes, and side effects in code.
2. **No phantom APIs.** Document only APIs, methods, parameters, config keys, and classes that exist in the current public export surface. Flag documented items that were removed or renamed.
3. **Contract honesty.** Highlight mismatches where docs promise behaviour the code does not deliver: thread-safety, synchronous execution, automatic retries, idempotency, ordering.
4. **Executable snippets.** Every snippet in `README.md`, `docs/`, `doc/`, `wiki/`, or inline examples must be syntactically valid and match current public signatures. No invented imports, no deprecated constructors.
5. **Report-only by default.** Writing documentation is a human-content action; only `apply` mutates files.
6. Under 15 lines in chat; detail in the report file.

## Steps

### 1. Inventory and public surface

1. Catalog documentation sources: `README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `SECURITY.md`, and the `docs/`, `doc/`, `wiki/` folders.
2. Extract the public surface: exports, classes, interfaces, CLI flags, environment variables, configuration options, endpoints. Use real entry points (`package.json#exports`/`main`, `pubspec.yaml`, `pyproject.toml`, `*.csproj`, `go.mod`, `Cargo.toml`, `index.ts`, `lib.rs`, `mod.rs`, `__init__.py`, `Program.cs`).

### 2. Detect discrepancies

- **Missing APIs**: public surface with no documentation.
- **Phantom or outdated APIs**: documented items that no longer exist or were renamed.
- **Contract mismatches**: documented behaviour versus runtime reality (error types, concurrency guarantees, defaults, lifecycle hooks).
- **Broken quickstarts**: snippets that fail to compile or lint, or reference internal paths.
- **Config drift**: env vars, flags, or defaults documented differently from code.

### 3. Report

Ensure `.tmp/docs-audit/` exists and `.tmp/` is git-ignored (append one `.tmp/` line to `.gitignore` if absent; skip outside git).

Write `.tmp/docs-audit/drift-report.md`:

1. **Discrepancy table**: `Documented Item | Doc File & Line | Actual Code Location | Nature (Missing / Outdated / Broken Example / Contract Drift)`.
2. **Architectural and behavioural misalignments**: prose that contradicts the implementation.
3. **Proposed updates**: a minimal unified diff (`--- a/` / `+++ b/`) per verified discrepancy, plus concise API reference entries for undocumented public APIs (parameters, defaults, one usage snippet).

### 4. Apply (only with `apply`)

- Apply the diffs exactly as proposed, with no opportunistic rewrites.
- Re-verify every touched snippet by running it, or by type-checking or linting it with the project's existing tooling.
- If a snippet cannot be verified, revert that snippet and leave it unresolved in the report.
- List every file changed.

## Output

1. Counts: missing, outdated, broken, contract drift.
2. The three highest-impact discrepancies (doc line mapped to code line).
3. Report path; if applied, files changed and the verification result.
4. One next action.
