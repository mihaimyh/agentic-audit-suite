import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILLS_ROOT = fileURLToPath(new URL('../skills', import.meta.url))

/**
 * Minimal, dependency-free frontmatter reader for the flat YAML we use:
 * `key: value` pairs, optionally single- or double-quoted.
 */
export function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) {
    return { data: {}, body: text.trim(), hasFrontmatter: false }
  }
  const end = text.indexOf('\n---', 3)
  if (end === -1) {
    return { data: {}, body: text.trim(), hasFrontmatter: false }
  }
  const header = text.slice(4, end)
  const body = text.slice(end + 4).replace(/^\n+/, '').trim()
  const data = {}
  for (const line of header.split('\n')) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim())
    if (!match) continue
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    data[match[1]] = value
  }
  return { data, body, hasFrontmatter: true }
}

/** Load every skill directory under `root`, sorted by name. */
export async function loadSkills(root = SKILLS_ROOT) {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    throw new Error(`Skills directory not found: ${root}`)
  }
  const skills = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const file = path.join(root, entry.name, 'SKILL.md')
    let raw
    try {
      raw = await readFile(file, 'utf8')
    } catch {
      continue
    }
    const { data, body } = parseFrontmatter(raw)
    skills.push({
      name: data.name || entry.name,
      folder: entry.name,
      description: data.description || '',
      body,
      dir: path.join(root, entry.name),
      file,
    })
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

/** Render a skill as an editor command file (opencode command format). */
export function toCommandFile(skill) {
  const frontmatter = [
    '---',
    `description: ${skill.description}`,
    'subagent: false',
    '---',
    '',
  ].join('\n')
  return `${frontmatter}\n${skill.body}\n`
}
