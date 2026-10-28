#!/usr/bin/env node
/**
 * Repository gate: validates every SKILL.md against the Agent Skills rules that
 * the six supported hosts actually enforce, plus the portability rules this kit
 * promises (no shell-specific tokens, no absolute paths, no host-only keywords).
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from '../src/skills.mjs'

const root = fileURLToPath(new URL('../skills', import.meta.url))
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

const REQUIRED_SKILLS = [
  'audit-init',
  'audit-next',
  'audit-status',
  'audit-final',
  'audit-reset',
  'docs-audit',
  'fix-init',
  'fix-next',
  'ux-plan',
]

const FORBIDDEN = [
  { re: /\$ARGUMENTS|\$[1-9]\b/, message: 'host-specific argument placeholder; document arguments in prose instead' },
  { re: /[A-Za-z]:\\\\|(?<![\w/])[A-Za-z]:\\/, message: 'absolute Windows path' },
  { re: /\/(home|Users)\/[A-Za-z0-9._-]+\//, message: 'absolute user path' },
  { re: /subagent:/, message: 'host-only frontmatter field' },
  { re: /\bTODO\b|\bTBD\b/, message: 'unfinished placeholder' },
]

const errors = []
const warnings = []
const rows = []

const dirs = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name)

for (const dir of dirs) {
  const file = path.join(root, dir, 'SKILL.md')
  let raw
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    errors.push(`${dir}: missing SKILL.md`)
    continue
  }

  const { data, body, hasFrontmatter } = parseFrontmatter(raw)
  if (!hasFrontmatter) errors.push(`${dir}: SKILL.md must start with YAML frontmatter`)
  if (!data.name) errors.push(`${dir}: missing required field "name"`)
  else if (data.name !== dir) errors.push(`${dir}: name "${data.name}" must equal the folder name`)
  else if (!NAME_RE.test(data.name)) errors.push(`${dir}: name must be lowercase-hyphen, no dots, slashes or colons`)
  else if (data.name.length > 64) errors.push(`${dir}: name exceeds 64 characters`)

  if (!data.description) errors.push(`${dir}: missing required field "description"`)
  else if (data.description.length > 1024) errors.push(`${dir}: description exceeds 1024 characters`)
  else if (data.description.length < 80) warnings.push(`${dir}: description under 80 characters, weak trigger signal`)

  if (body.length < 300) errors.push(`${dir}: body shorter than 300 characters`)
  if (/\r\n/.test(raw)) errors.push(`${dir}: contains CRLF line endings`)
  if (!body.includes('## ')) warnings.push(`${dir}: body has no section headings`)

  for (const rule of FORBIDDEN) {
    if (rule.re.test(raw)) errors.push(`${dir}: ${rule.message}`)
  }

  rows.push({ skill: dir, description: `${data.description?.length ?? 0} chars` })
}

const missing = REQUIRED_SKILLS.filter((name) => !dirs.includes(name))
for (const name of missing) errors.push(`missing required skill: ${name}`)

const width = Math.max(...rows.map((row) => row.skill.length), 5)
console.log(`${'SKILL'.padEnd(width)}  DESC`)
for (const row of rows) console.log(`${row.skill.padEnd(width)}  ${row.description}`)

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const warning of warnings) console.log(`  warn  ${warning}`)
}
if (errors.length > 0) {
  console.log(`\n${errors.length} error(s):`)
  for (const error of errors) console.log(`  error ${error}`)
  process.exit(1)
}

console.log(`\nok: ${rows.length} skills valid`)
