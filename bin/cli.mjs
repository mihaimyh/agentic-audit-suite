#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { install, uninstallTarget } from '../src/install.mjs'
import { loadSkills } from '../src/skills.mjs'
import { TARGETS, resolveTargetPath, resolveTargets } from '../src/targets.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await readFile(path.join(here, '..', 'package.json'), 'utf8'))

const HELP = `agentic-audit-suite ${pkg.version}

Portable agent skills for codebase audits, TDD remediation, docs drift and product design.

Usage
  npx ${pkg.name} [install] [options]
  npx ${pkg.name} list
  npx ${pkg.name} uninstall [options]
  npx ${pkg.name} doctor [options]

Options
  --targets <ids>    Comma-separated subset: ${TARGETS.map((t) => t.id).join(', ')}
  --project          Install into the current repository instead of the home directory
  --link             Symlink skill folders instead of copying (junction on Windows)
  --force            Overwrite existing skill folders
  --dry-run          Show what would happen, change nothing
  --skills <names>   Install only these skill names
  --json             Machine-readable output
  -h, --help         Show this help
  -v, --version      Show the version

Examples
  npx ${pkg.name} install
  npx ${pkg.name} install --targets codex,cursor,claude
  npx ${pkg.name} install --project --targets copilot,claude
  npx ${pkg.name} install --link --dry-run
  npx ${pkg.name} uninstall --targets codex
`

function parseArgs(argv) {
  const options = { command: 'install', targets: [], skills: [], flags: new Set() }
  const rest = [...argv]
  while (rest.length > 0) {
    const arg = rest.shift()
    if (arg === '--targets' || arg === '--only') options.targets.push(...String(rest.shift() ?? '').split(','))
    else if (arg === '--skills') options.skills.push(...String(rest.shift() ?? '').split(','))
    else if (arg === '--help' || arg === '-h') options.flags.add('help')
    else if (arg === '--version' || arg === '-v') options.flags.add('version')
    else if (arg === '--project') options.flags.add('project')
    else if (arg === '--link') options.flags.add('link')
    else if (arg === '--force') options.flags.add('force')
    else if (arg === '--dry-run') options.flags.add('dry-run')
    else if (arg === '--json') options.flags.add('json')
    else if (['install', 'list', 'uninstall', 'doctor'].includes(arg)) options.command = arg
    else if (arg.startsWith('-')) throw new Error(`Unknown flag: ${arg}`)
  }
  return options
}

function printReport({ skills, results }, flags) {
  const dryRun = flags.has('dry-run')
  const lines = []
  lines.push(
    `${dryRun ? 'Dry run' : 'Installed'} ${skills.length} skill${skills.length === 1 ? '' : 's'} (${pkg.version})`,
  )
  for (const result of results) {
    lines.push('')
    lines.push(`${result.target.label} -> ${result.root}`)
    for (const record of result.records) {
      lines.push(`  ${record.action.padEnd(12)} ${record.name}`)
    }
  }
  const configured = new Set(results.map((r) => r.target.id))
  const skippedTargets = TARGETS.filter((t) => !configured.has(t.id))
  if (skippedTargets.length > 0) {
    lines.push('')
    lines.push(`Not targeted: ${skippedTargets.map((t) => t.id).join(', ')}`)
  }
  console.log(lines.join('\n'))
}

const options = parseArgs(process.argv.slice(2))

try {
  if (options.flags.has('help')) {
    console.log(HELP)
    process.exit(0)
  }
  if (options.flags.has('version')) {
    console.log(pkg.version)
    process.exit(0)
  }

  const targets = resolveTargets(options.targets)
  const base = {
    version: pkg.version,
    project: options.flags.has('project'),
    link: options.flags.has('link'),
    force: options.flags.has('force'),
    dryRun: options.flags.has('dry-run'),
  }

  if (options.command === 'list') {
    const skills = await loadSkills()
    for (const skill of skills) {
      console.log(`${skill.name}\n  ${skill.description}\n`)
    }
    process.exit(0)
  }

  if (options.command === 'doctor') {
    const skills = await loadSkills()
    console.log(`node ${process.version} | kit ${pkg.version} | ${skills.length} skills bundled`)
    for (const target of targets) {
      const root = resolveTargetPath(target, { project: base.project })
      console.log(`${target.id.padEnd(12)} ${root}`)
    }
    process.exit(0)
  }

  if (options.command === 'uninstall') {
    const results = []
    for (const target of targets) {
      results.push(await uninstallTarget(target, base))
    }
    for (const result of results) {
      console.log(`${result.target.label} -> ${result.root}`)
      console.log(result.removed.length > 0 ? result.removed.map((r) => `  removed ${r}`).join('\n') : '  nothing to remove')
    }
    process.exit(0)
  }

  const allSkills = await loadSkills()
  const wanted = options.skills.filter(Boolean)
  const skills = wanted.length > 0 ? allSkills.filter((skill) => wanted.includes(skill.name)) : allSkills
  if (skills.length === 0) throw new Error('No skills matched the filter.')

  const report = await install({ ...base, targets, skills })
  if (options.flags.has('json')) console.log(JSON.stringify(report, null, 2))
  else printReport(report, options.flags)
} catch (error) {
  console.error(`error: ${error.message}`)
  process.exit(1)
}
