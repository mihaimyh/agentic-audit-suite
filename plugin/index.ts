import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Plugin } from '@opencode/plugin'

const SKILLS_ROOT = fileURLToPath(new URL('../skills', import.meta.url))

type Skill = { name: string; description: string; body: string }

function parseFrontmatter(raw: string): { name?: string; description?: string; body: string } {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) return { body: text.trim() }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { body: text.trim() }

  const header = text.slice(4, end)
  const body = text.slice(end + 4).replace(/^\n+/, '').trim()
  const fields: Record<string, string> = {}
  for (const line of header.split('\n')) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim())
    if (!match) continue
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    fields[match[1]] = value
  }
  return { name: fields.name, description: fields.description, body }
}

async function loadSkills(): Promise<Skill[]> {
  const entries = await readdir(SKILLS_ROOT, { withFileTypes: true })
  const skills: Skill[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const file = path.join(SKILLS_ROOT, entry.name, 'SKILL.md')
    let raw: string
    try {
      raw = await readFile(file, 'utf8')
    } catch {
      continue
    }
    const parsed = parseFrontmatter(raw)
    skills.push({
      name: parsed.name ?? entry.name,
      description: parsed.description ?? '',
      body: parsed.body,
    })
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Registers every bundled skill as a first-class slash command, so arguments are
 * passed through natively instead of being appended as loose text.
 */
export default Plugin.define({
  id: 'agentic-audit-suite',
  async setup(ctx) {
    const skills = await loadSkills()

    await ctx.command.transform((editor) => {
      for (const skill of skills) {
        editor.add({
          name: skill.name,
          description: skill.description,
          execute: async ({ sessionID, prompt, delivery }) => {
            const args = prompt.text.trim()
            const invocation = args.length > 0 ? `## Invocation arguments\n\n${args}` : ''
            await ctx.session.prompt({
              ...prompt,
              sessionID,
              text: [skill.body, invocation].filter(Boolean).join('\n\n'),
              delivery,
            })
          },
        })
      }
    })

    return async () => {
      // Registrations are disposed when the plugin unloads.
    }
  },
})
