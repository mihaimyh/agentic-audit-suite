import os from 'node:os'
import path from 'node:path'

/**
 * Every target is a place a coding agent already looks for skills or commands.
 * `kind: 'skills'` copies skill folders, `kind: 'commands'` renders one Markdown
 * command file per skill.
 */
export const TARGETS = [
  {
    id: 'codex',
    label: 'OpenAI Codex',
    kind: 'skills',
    global: ['.agents', 'skills'],
    project: ['.agents', 'skills'],
    docs: 'https://developers.openai.com/codex/build-skills',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    kind: 'skills',
    global: ['.cursor', 'skills'],
    project: ['.agents', 'skills'],
    docs: 'https://cursor.com/docs/skills',
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot (VS Code)',
    kind: 'skills',
    global: ['.copilot', 'skills'],
    project: ['.github', 'skills'],
    docs: 'https://code.visualstudio.com/docs/agent-customization/agent-skills',
  },
  {
    id: 'claude',
    label: 'Claude Code',
    kind: 'skills',
    global: ['.claude', 'skills'],
    project: ['.claude', 'skills'],
    docs: 'https://code.claude.com/docs/en/skills',
  },
  {
    id: 'antigravity',
    label: 'Google Antigravity',
    kind: 'skills',
    global: ['.gemini', 'config', 'skills'],
    project: ['.agents', 'skills'],
    docs: 'https://antigravity.google/docs/skills',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    kind: 'commands',
    global: ['.config', 'opencode', 'commands'],
    project: ['.opencode', 'commands'],
    docs: 'https://opencode.ai/v2/docs/commands',
  },
]

export const TARGET_IDS = TARGETS.map((target) => target.id)

export function homeDir() {
  return process.env.HOME || process.env.USERPROFILE || os.homedir()
}

export function resolveTargetPath(target, { project = false, cwd = process.cwd(), home = homeDir() } = {}) {
  const base = project ? cwd : home
  return path.join(base, ...(project ? target.project : target.global))
}

export function resolveTargets(ids) {
  if (!ids || ids.length === 0) return [...TARGETS]
  const wanted = new Set(ids.map((id) => String(id).trim().toLowerCase()).filter(Boolean))
  const unknown = [...wanted].filter((id) => !TARGET_IDS.includes(id))
  if (unknown.length > 0) {
    throw new Error(`Unknown target(s): ${unknown.join(', ')}. Valid targets: ${TARGET_IDS.join(', ')}.`)
  }
  return TARGETS.filter((target) => wanted.has(target.id))
}
