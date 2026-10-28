import { cp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadSkills, toCommandFile } from './skills.mjs'
import { resolveTargetPath } from './targets.mjs'

const MANIFEST = '.agentic-audit-suite.json'

async function exists(target) {
  try {
    await stat(target)
    return true
  } catch {
    return false
  }
}

async function readManifest(root) {
  try {
    const raw = await readFile(path.join(root, MANIFEST), 'utf8')
    const parsed = JSON.parse(raw)
    return { version: parsed.version, entries: Array.isArray(parsed.entries) ? parsed.entries : [] }
  } catch {
    return { version: undefined, entries: [] }
  }
}

async function writeManifest(root, version, previous) {
  const entries = [...new Set(previous)]
  await writeFile(
    path.join(root, MANIFEST),
    `${JSON.stringify({ name: '@mihaimyh/agentic-audit-suite', version, entries: entries.sort() }, null, 2)}\n`,
    'utf8',
  )
}

/**
 * Install skills (or generated command files) for one target.
 * Returns a list of { name, action, destination } records.
 */
export async function installTarget(target, options) {
  const { version = '0.0.0', dryRun = false, force = false, link = false, project = false, cwd, home, skills } = options
  const root = resolveTargetPath(target, { project, cwd, home })
  const records = []

  for (const skill of skills) {
    const name = target.kind === 'commands' ? `${skill.name}.md` : skill.folder
    const destination = path.join(root, name)
    const present = await exists(destination)

    if (present && !force) {
      records.push({ name, action: 'skip (exists)', destination })
      continue
    }
    records.push({
      name,
      action: dryRun ? (link ? 'would link' : 'would write') : link ? 'link' : 'write',
      destination,
    })
    if (dryRun) continue

    await mkdir(root, { recursive: true })
    if (present) await rm(destination, { recursive: true, force: true })

    if (target.kind === 'commands') {
      await writeFile(destination, toCommandFile(skill), 'utf8')
    } else if (link) {
      await symlink(skill.dir, destination, process.platform === 'win32' ? 'junction' : 'dir')
    } else {
      await cp(skill.dir, destination, { recursive: true })
    }
  }

  if (!dryRun) {
    const previous = await readManifest(root)
    await writeManifest(root, version, [...previous.entries, ...records.filter((r) => r.action !== 'skip (exists)').map((r) => r.name)])
  }

  return { target, root, records }
}

/** Remove only entries this tool installed, leaving anything else untouched. */
export async function uninstallTarget(target, options) {
  const { dryRun = false, project = false, cwd, home } = options
  const root = resolveTargetPath(target, { project, cwd, home })
  const manifest = await readManifest(root)
  const removed = []

  for (const entry of manifest.entries) {
    const destination = path.join(root, entry)
    if (!(await exists(destination))) continue
    removed.push(destination)
    if (!dryRun) await rm(destination, { recursive: true, force: true })
  }
  if (!dryRun && removed.length > 0) {
    await rm(path.join(root, MANIFEST), { force: true })
  }
  return { target, root, removed }
}

export async function install(options = {}) {
  const skills = options.skills ?? (await loadSkills(options.skillsRoot))
  const targets = options.targets ?? []
  const results = []
  for (const target of targets) {
    results.push(await installTarget(target, { ...options, skills }))
  }
  return { skills, results }
}
