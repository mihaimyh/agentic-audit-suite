---
name: audit-init
description: Bootstrap an iterative, multi-stage codebase audit. Detects the stack from manifests, partitions the repository into cohesive modules (5-20 files each), resolves the exact test command per module, and writes .tmp/audit/audit_state.json. Use when starting a full architecture or correctness audit of a repo, when asked to review an entire codebase, or when the audit state file does not exist yet.
---

# Audit initialization

You are a Principal Software Architect initializing an iterative audit. This turn inspects the workspace, partitions it into audit modules, resolves tooling, and initializes state on disk.

**Do not audit code in this turn.**

## Arguments

The text after the command is the audit scope:

- empty: audit the whole repository in the current working directory;
- a path (for example `packages/api`): restrict the audit to that subtree.

## Rules

1. **Portability.** Never assume a language, framework, or layout. Detect the stack from manifests: `package.json`, `pubspec.yaml`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `*.csproj`, `pom.xml`, `build.gradle*`, `composer.json`, `Gemfile`, `CMakeLists.txt`, `mix.exs`. In a monorepo, detect every workspace and nested manifest.
2. **Local state only.** All scratch state lives under `.tmp/` in the project root. Write nothing outside `.tmp/` in this phase.
3. **Short chat output.** Keep the chat reply under 15 lines: verdict, paths, next action. Put detail in files.
4. **Reply language.** Answer in the language of the user's last message. Keep file contents in English.
5. **Verified evidence only.** Anything not provable from the repository should be marked as an assumption, not stated as fact.

## Steps

### 1. Guard

If `.tmp/audit/audit_state.json` already exists, stop. Report its `status` and `current_module_index`/`total_modules`, then tell the user to inspect it (`audit-status`), resume it (`audit-next`), or reset it (`audit-reset confirm`). Write nothing.

### 2. Stack discovery

Inspect root manifests, lockfiles, and top-level directories. Identify every active platform, language, runtime, and test runner. Take the package manager from the lockfile, not from guesswork.

### 3. Partitioning (scale and cohesion)

1. **Dynamic scaling, no arbitrary caps.** Expect 4 to 25+ modules depending on repository size.
2. **Sizing guardrail.** One module is one cohesive domain, package, or architectural layer (for example `backend/storage`, `frontend/state`, `core/runtime`). Target 5-20 source files or roughly 1,000-3,000 lines of code. Split any directory above 25 source files or containing distinct sub-domains.
3. **Hard exclusions.** Never create modules for generated code (`*.pb.*`, `*.g.*`, `*_generated.*`, `*.freezed.dart`, `*.designer.cs`), vendored third-party directories, lockfiles, mock fixtures, or build output (`build/`, `dist/`, `target/`, `node_modules/`, `.dart_tool/`, `bin/`, `obj/`).
4. **Per-module metadata.** Every module declares `id`, `domain` (`backend`, `frontend`, `shared`, `core`, `infra`), `path`, `language`, and the exact `test_cmd` that runs its unit and integration tests, with race or sanitizer flags where the ecosystem supports them (`go test -race ./...`, `cargo test`, `flutter test`, `npm test`, `pytest -q`, `dotnet test`, and so on). Use `null` when the command cannot be determined.

### 4. Scratch setup

- Create `.tmp/audit/findings/` and `.tmp/audit/repros/`.
- Ensure `.tmp/` is git-ignored: if `.gitignore` exists and has no `.tmp` rule, append one line `.tmp/`. Never rewrite existing content. Skip silently outside a git repository.

### 5. Confirmation gate

Print a compact table of every module: `id | domain | path | language | test_cmd`. Above 25 modules, group by domain and show counts plus the first five per domain.

Then ask exactly one question: *"Confirm these test commands, or give corrections?"*

**Do not write the state file yet.** Stop after the question.

### 6. Write state (only after confirmation)

Write `.tmp/audit/audit_state.json`:

```json
{
  "project_name": "detected_project_name",
  "status": "IN_PROGRESS",
  "current_module_index": 0,
  "total_modules": 0,
  "modules": [
    {
      "id": "domain_layer_subsystem",
      "domain": "backend",
      "path": "relative/path/to/module",
      "language": "detected_language",
      "test_cmd": "exact command to run tests in this module",
      "status": "PENDING",
      "description": "Concise summary of module responsibility and primary exports",
      "findings_count": 0
    }
  ]
}
```

`total_modules` must equal `modules.length`. Every status starts `"PENDING"`. `project_name` is the repository or directory name.

## Output

1. Module count grouped by domain.
2. The confirmation table.
3. Either `state not written yet - waiting for test_cmd confirmation.` or, after confirmation, the state path plus the next action: run `audit-next`.
