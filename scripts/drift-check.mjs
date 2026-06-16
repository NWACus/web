#!/usr/bin/env node
// Wrapper around `drift check` that ignores findings in vendored Claude skill
// bundles (.agents/skills, .claude/skills). drift 0.10.0 has no native exclude
// mechanism and scans every git-tracked markdown file, so these bundles' internal
// cross-links (which point at reference dirs we don't vendor) show up as broken.
// Those are not our docs and aren't bound to our code — filter them out here.
//
// Passes through any extra args (e.g. --changed <path>) to drift.

import { spawnSync } from 'node:child_process'

const IGNORED_PREFIXES = ['.agents/skills/', '.claude/skills/']

const isIgnored = (p) => IGNORED_PREFIXES.some((prefix) => p?.startsWith(prefix))

const extraArgs = process.argv.slice(2)
const { stdout, status, error } = spawnSync('drift', ['check', '--format', 'json', ...extraArgs], {
  encoding: 'utf8',
})

if (error) {
  console.error('failed to run drift:', error.message)
  process.exit(1)
}

let report
try {
  report = JSON.parse(stdout)
} catch {
  console.error('could not parse drift JSON output:')
  console.error(stdout)
  process.exit(status ?? 1)
}

const docs = (report.docs ?? []).filter((doc) => !isIgnored(doc.path))

const staleDocs = docs.filter((doc) => doc.result === 'stale')
const staleAnchors = docs.flatMap((doc) =>
  (doc.anchors ?? [])
    .filter((a) => a.result !== 'ok' && a.result !== 'fresh')
    .map((a) => ({ doc: doc.path, target: a.raw, reason: a.reason?.message })),
)
const brokenLinks = docs.flatMap((doc) =>
  (doc.links ?? [])
    .filter((l) => l.result === 'broken')
    .map((l) => ({ doc: doc.path, target: l.target, line: l.line })),
)

const problems = staleDocs.length + staleAnchors.length + brokenLinks.length

if (problems === 0) {
  console.log(`drift: ${docs.length} docs ok (vendored skill bundles excluded)`)
  process.exit(0)
}

for (const a of staleAnchors) {
  console.error(`STALE  ${a.doc} -> ${a.target}${a.reason ? ` (${a.reason})` : ''}`)
}
for (const l of brokenLinks) {
  console.error(`BROKEN ${l.doc}:${l.line} -> ${l.target} (link target not found)`)
}
console.error(
  `\ndrift: ${staleDocs.length} stale doc(s), ${staleAnchors.length} stale anchor(s), ${brokenLinks.length} broken link(s)`,
)
process.exit(1)
