import { waybackUrl, type NotFoundReport, type PathHits } from './notFoundReport'

type ExclusionReason = NotFoundReport['excluded'][number]['reason']

const EXCLUSION_DESCRIPTIONS: Record<ExclusionReason, string> = {
  'dead-legacy-path':
    'Old WordPress addresses with no equivalent on the new site: feeds, plugin files, login pages.',
  'not-redirectable': "Files and API addresses the site can't redirect, like /favicon.ico.",
  probe: 'Automatic checks by browsers and security scanners.',
  'live-path': 'Addresses that work now; the errors were temporary.',
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

// Replaces the characters HTML treats as markup with their entities
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char])

const formatNumber = (value: number) => value.toLocaleString('en-US')

const DAY_MS = 24 * 60 * 60 * 1000

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// The range end is exclusive midnight, so the last day covered is the day before it
function formatRange({ start, end }: NotFoundReport['range']): string {
  return `${formatDate(Date.parse(start))} – ${formatDate(Date.parse(end) - DAY_MS)}`
}

// ai_crawler → AI crawler: underscores to spaces, "ai" uppercased, first letter capitalized
function humanizeCategory(name: string): string {
  const words = name.replace(/_/g, ' ').replace(/\bai\b/g, 'AI')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function hitsBar(hits: number, max: number): string {
  const width = max > 0 ? Math.max(1, Math.round((hits / max) * 100)) : 0
  return `<td class="num">${formatNumber(hits)}<span class="bar"><span style="width:${width}%"></span></span></td>`
}

function statCard(value: number, label: string): string {
  return `<div class="stat"><strong>${formatNumber(value)}</strong><span>${escapeHtml(label)}</span></div>`
}

function externalLink(href: string, text: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`
}

function redirectRow(report: NotFoundReport, max: number) {
  return ({ from, to, hits }: NotFoundReport['redirects'][number]) => {
    const suggestion = to
      ? externalLink(`https://${report.domain}${to}`, to)
      : '<span class="muted">—</span>'
    return `<tr>${hitsBar(hits, max)}<td class="path">${externalLink(waybackUrl(report, from), from)}</td><td class="path">${suggestion}</td></tr>`
  }
}

function redirectsSection(report: NotFoundReport): string {
  const max = report.redirects[0]?.hits ?? 0
  return `<section>
  <h2>Old addresses people are still visiting</h2>
  <p>Each old address links to an archived copy of the page from your previous site, so you can see what used to be there.</p>
  <table>
    <thead><tr><th class="num">Visits</th><th>Old address</th><th>Suggested new page</th></tr></thead>
    <tbody>${report.redirects.map(redirectRow(report, max)).join('')}</tbody>
  </table>
</section>`
}

function nameTable(
  title: string,
  rows: { name: string; hits: number }[],
  label: (name: string) => string,
): string {
  const max = rows[0]?.hits ?? 0
  const body = rows
    .map(({ name, hits }) => `<tr>${hitsBar(hits, max)}<td>${escapeHtml(label(name))}</td></tr>`)
    .join('')
  return `<div><h3>${escapeHtml(title)}</h3><table><thead><tr><th class="num">Requests</th><th>Name</th></tr></thead><tbody>${body}</tbody></table></div>`
}

function pathTable<Row extends PathHits>(rows: Row[], note: (row: Row) => string = () => '') {
  const max = rows[0]?.hits ?? 0
  const body = rows
    .map(
      (row) =>
        `<tr>${hitsBar(row.hits, max)}<td class="path">${escapeHtml(row.path)}</td><td class="muted">${escapeHtml(note(row))}</td></tr>`,
    )
    .join('')
  return `<table><thead><tr><th class="num">Requests</th><th>Address</th><th></th></tr></thead><tbody>${body}</tbody></table>`
}

function botsSection({ totals, bots }: NotFoundReport): string {
  const botTotal = totals.notFound - totals.notFoundNonBot
  return `<section>
  <h2>Automated traffic</h2>
  <p>Bots made ${formatNumber(botTotal)} of the requests for missing pages. They don't need redirects, but they show who is still crawling the old site. “Unknown” means automated clients that don't identify themselves, such as scripts and apps still pulling data from old addresses.</p>
  <div class="columns">${nameTable('By category', bots.byCategory, humanizeCategory)}${nameTable('By bot', bots.byName, (name) => name)}</div>
  <details><summary>Addresses bots requested most in the last 7 days (${bots.topPaths.length})</summary>${pathTable(bots.topPaths)}</details>
</section>`
}

function excludedSection({ excluded }: NotFoundReport): string {
  const reasons = Object.entries(EXCLUSION_DESCRIPTIONS)
    .map(([reason, description]) => `<li><code>${reason}</code>: ${escapeHtml(description)}</li>`)
    .join('')
  return `<section>
  <details><summary>Set aside, no action needed (${excluded.length})</summary>
    <ul>${reasons}</ul>
    ${pathTable(excluded, ({ reason }) => reason)}
  </details>
</section>`
}

const STYLES = `
  :root { color-scheme: light; --ink: #1c2733; --muted: #5b6b7b; --line: #e3e8ee; --accent: #1f5f8b; --bar: #d6e6f2; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background: #f6f8fa; }
  main { max-width: 980px; margin: 0 auto; padding: 48px 24px 64px; }
  header p { margin: 0; color: var(--muted); }
  .eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; font-weight: 600; color: var(--accent); }
  h1 { margin: 4px 0; font-size: 30px; }
  h2 { margin: 0 0 6px; font-size: 20px; }
  h3 { margin: 0 0 8px; font-size: 15px; }
  section { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 24px; margin-top: 24px; }
  section > p { margin: 0 0 16px; color: var(--muted); }
  .help { border-left: 4px solid var(--accent); }
  .help ol { margin: 8px 0 0; padding-left: 20px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 24px; }
  .stat { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
  .stat strong { display: block; font-size: 24px; }
  .stat span { color: var(--muted); font-size: 13px; }
  .columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); padding: 6px 8px; border-bottom: 1px solid var(--line); }
  td { padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .num { width: 120px; font-variant-numeric: tabular-nums; }
  .bar { display: block; height: 4px; margin-top: 4px; background: var(--line); border-radius: 2px; }
  .bar span { display: block; height: 100%; background: var(--accent); border-radius: 2px; }
  .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; word-break: break-all; }
  .muted { color: var(--muted); }
  a { color: var(--accent); }
  details summary { cursor: pointer; font-weight: 600; }
  details[open] summary { margin-bottom: 12px; }
  footer { margin-top: 32px; color: var(--muted); font-size: 13px; }
`

/** A standalone page summarizing the report, for sharing with center staff. */
export function toReportHtml(report: NotFoundReport): string {
  const withDestination = report.redirects.filter(({ to }) => to).length
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(report.centerName)}: old website addresses</title>
<style>${STYLES}</style>
</head>
<body>
<main>
<header>
  <p class="eyebrow">Old website addresses report</p>
  <h1>${escapeHtml(report.centerName)}</h1>
  <p>${escapeHtml(report.domain)} · ${formatRange(report.range)}</p>
</header>
<div class="stats">
  ${statCard(report.totals.notFoundNonBot, 'visits by people to missing pages')}
  ${statCard(report.redirects.length, 'old addresses to review')}
  ${statCard(withDestination, 'with a suggested new page')}
  ${statCard(report.totals.notFound - report.totals.notFoundNonBot, 'requests by bots')}
</div>
<section class="help">
  <h2>How you can help</h2>
  <p>Your new website organizes pages differently, so links to your old site from bookmarks, other websites and search results now land on a “page not found” page. A redirect sends each old address to the right new page.</p>
  <ol>
    <li>Open the accompanying spreadsheet, <code>redirects.csv</code>, in Google Sheets or Excel.</li>
    <li>For each old address, put the new page it should go to in the <code>to</code> column, as an address on your site like <code>/forecasts/avalanche</code>. Some rows already have a suggestion; check those too.</li>
    <li>If you're not sure, leave <code>to</code> empty and explain in <code>notes</code>. Leave both empty for addresses that don't need a new home.</li>
    <li>Send the spreadsheet back to us as a CSV file and we'll set up the redirects.</li>
  </ol>
</section>
${redirectsSection(report)}
${botsSection(report)}
${excludedSection(report)}
<footer>Generated by <code>pnpm report:404s ${escapeHtml(report.tenant)}</code> from Vercel request logs. Visits count requests from browsers Vercel doesn't classify as bots.</footer>
</main>
</body>
</html>
`
}
