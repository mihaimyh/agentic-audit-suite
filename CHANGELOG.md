# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-28

### Added

- Nine portable Agent Skills: `audit-init`, `audit-next`, `audit-status`, `audit-final`, `audit-reset`, `docs-audit`, `fix-init`, `fix-next`, `ux-plan`.
- Stateful audit pipeline driven by `.tmp/audit/audit_state.json`, with mandatory failing reproductions and multi-scale benchmarks.
- Severity-ordered remediation queue in `.tmp/fix/fix_state.json`, TDD red/green/suite gate, atomic local commits, `BLOCKED` after three failed reproductions.
- Zero-dependency installer (`npx @mihaimyh/agentic-audit-suite`) targeting Codex, Claude Code, Cursor, GitHub Copilot, Google Antigravity and OpenCode, with `--project`, `--link`, `--force`, `--dry-run`, `--skills`, `--uninstall`.
- Install manifest per target, so uninstall removes only entries this tool created.
- OpenCode server plugin that registers each skill as a native slash command with argument pass-through.
- Claude Code plugin and marketplace manifests.
- `npm test` gate: frontmatter, naming, description limits, portability rules, required skill list.
- Documentation: pipeline specification, portability matrix, skill authoring contract.

[Unreleased]: https://github.com/mihaimyh/agentic-audit-suite/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mihaimyh/agentic-audit-suite/releases/tag/v0.1.0
