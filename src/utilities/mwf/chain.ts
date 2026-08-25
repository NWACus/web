// Chain-head resolution for MWF forecast rows — the pure heart of the
// workflow semantics, ported from products-api's crud_mwf_forecast.py lean
// chain queries so every visibility rule is unit-testable.
//
// An issuance's public state is its chain HEAD: the most recent non-draft row
// for (service date, issuance), by row id (creation order). Revision numbers
// are provenance, not the resolution key — a fresh forecast published after a
// withdrawal restarts at revision 1 and must still win. A withdrawn head
// withdraws the whole issuance instead of resurfacing an older revision;
// drafts never affect the public state.
//
// The CURRENT published product stays active until its replacement is
// actually live: a scheduled correction whose issue time hasn't arrived is
// not yet a visibility candidate (the older revision keeps serving until it
// goes live), and a row withdrawn BEFORE it ever went live is a non-event
// (its withdrawnAt precedes its issue time). Only withdrawal of a live
// product withdraws the issuance.

export type ChainStatus = 'draft' | 'published' | 'withdrawn'

export interface ChainRow {
  id: number
  status: ChainStatus
  issuance: 'morning' | 'afternoon'
  serviceDate: string
  issuedAt: string | null
  withdrawnAt: string | null
  revision: number
  supersedes: number | null
}

const slotKey = (row: Pick<ChainRow, 'serviceDate' | 'issuance'>) =>
  `${row.serviceDate}|${row.issuance}`

const time = (iso: string | null): number | null => {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

// Newest row per slot among the given candidates, by id (creation order).
function headsBySlot(rows: ChainRow[]): Map<string, ChainRow> {
  const heads = new Map<string, ChainRow>()
  rows.forEach((row) => {
    const key = slotKey(row)
    const head = heads.get(key)
    if (!head || row.id > head.id) heads.set(key, row)
  })
  return heads
}

// Operative heads: per slot, the newest non-draft row — kept only while
// published (a withdrawn head vacates the slot). Includes scheduled-future
// rows; this is the publish guard's view of "who owns the slot".
export function operativeHeads(rows: ChainRow[]): Map<string, ChainRow> {
  const heads = headsBySlot(rows.filter((r) => r.status !== 'draft'))
  const out = new Map<string, ChainRow>()
  heads.forEach((row, key) => {
    if (row.status === 'published') out.set(key, row)
  })
  return out
}

export function operativeSlotHead(
  rows: ChainRow[],
  serviceDate: string,
  issuance: ChainRow['issuance'],
): ChainRow | null {
  return operativeHeads(rows).get(`${serviceDate}|${issuance}`) ?? null
}

// Visible heads: the public state. Candidates are published rows whose issue
// time has arrived, plus withdrawn rows that were live when withdrawn (their
// withdrawal hides the issuance). The newest candidate per slot wins; the
// slot renders only while that head is published.
export function visibleHeads(rows: ChainRow[], now: Date = new Date()): Map<string, ChainRow> {
  const nowT = now.getTime()
  const candidates = rows.filter((row) => {
    const issued = time(row.issuedAt)
    if (row.status === 'published') return issued != null && issued <= nowT
    if (row.status === 'withdrawn') {
      const withdrawn = time(row.withdrawnAt)
      return issued != null && withdrawn != null && withdrawn >= issued
    }
    return false
  })
  const heads = headsBySlot(candidates)
  const out = new Map<string, ChainRow>()
  heads.forEach((row, key) => {
    if (row.status === 'published') out.set(key, row)
  })
  return out
}

const byIssuedDesc = (a: ChainRow, b: ChainRow) => {
  const at = time(a.issuedAt)
  const bt = time(b.issuedAt)
  if (at !== bt) return (bt ?? -Infinity) - (at ?? -Infinity)
  return b.id - a.id
}

// The visible issuances FOR a service date, newest first — at most one per
// issuance (its chain head). No date → the latest service date with visible
// content, so the stacked public view shows morning + afternoon together.
// A withdrawn PM falls back to the AM head this way — never to an older PM
// revision.
export function visibleForDate(
  rows: ChainRow[],
  { date, now = new Date() }: { date?: string; now?: Date } = {},
): ChainRow[] {
  const heads = Array.from(visibleHeads(rows, now).values())
  if (!heads.length) return []
  const target =
    date ??
    heads
      .map((h) => h.serviceDate)
      .sort()
      .at(-1)
  return heads.filter((h) => h.serviceDate === target).sort(byIssuedDesc)
}

// The newest visible head across all service dates — "the current forecast".
export function latestVisibleHead(rows: ChainRow[], now: Date = new Date()): ChainRow | null {
  const heads = Array.from(visibleHeads(rows, now).values()).sort(byIssuedDesc)
  return heads[0] ?? null
}
