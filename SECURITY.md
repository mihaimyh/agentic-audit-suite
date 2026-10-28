# Security policy

## Scope

This project ships **prompt assets** and a **local file installer**. It has no server component, no telemetry, and no network calls at runtime.

## Threat model

| Risk | Mitigation |
| :--- | :--- |
| A skill instructs an agent to run destructive git commands | Skills forbid `git push`, `git add .`, `reset --hard`, and any history rewrite; `fix-next` stages files by explicit path |
| A skill silently overwrites state | Every entry point guards on an existing state file and requires an explicit reset token |
| Cleanup deletes user work | `audit-reset` is a dry run unless the arguments contain `confirm`, and deletes only paths under `.tmp/` |
| Installer writes outside documented paths | Destinations are the fixed per-host skill/command directories; the manifest records exactly what was written |
| Prompt injection from repository content | Skills treat repository content as data. Findings must be proven by executing a reproduction, not by trusting a comment or a README |
| Supply chain | Single runtime dependency (`@opencode/plugin`), pinned by semver, and only loaded by OpenCode |

## Reporting a vulnerability

Open a private security advisory on GitHub, or email the maintainer listed in `package.json`. Include:

- the host and version you used;
- the exact command;
- the skill name and the line that misbehaved;
- what the agent did that it should not have done.

Expect an acknowledgement within 72 hours. Do not open a public issue for anything that could lead an agent to destructive behaviour.

## Supported versions

Only the latest minor release receives security fixes.
