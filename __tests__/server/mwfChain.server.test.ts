// Every public-visibility state of the MWF workflow, exercised against the
// pure chain-head resolution. These are the states the workflow port must
// hold: drafts invisible, embargoed rows not yet live, corrections winning by
// creation order, withdrawal semantics (live vs never-live), and the
// PM-falls-back-to-AM rule.
import {
  ChainRow,
  latestVisibleHead,
  operativeHeads,
  operativeSlotHead,
  visibleForDate,
  visibleHeads,
} from '@/utilities/mwf/chain'

const NOW = new Date('2026-08-25T18:00:00Z')
const past = '2026-08-25T14:00:00.000Z'
const earlier = '2026-08-25T07:00:00.000Z'
const future = '2026-08-25T23:00:00.000Z'

let nextId = 1
function row(overrides: Partial<ChainRow>): ChainRow {
  return {
    id: nextId++,
    status: 'published',
    issuance: 'morning',
    serviceDate: '2026-08-25',
    issuedAt: past,
    withdrawnAt: null,
    revision: 1,
    supersedes: null,
    ...overrides,
  }
}
beforeEach(() => {
  nextId = 1
})

describe('operative heads (the publish guard view)', () => {
  it('drafts never occupy a slot', () => {
    const rows = [row({ status: 'draft' })]
    expect(operativeSlotHead(rows, '2026-08-25', 'morning')).toBeNull()
  })

  it('a scheduled-future published row still owns its slot', () => {
    const rows = [row({ issuedAt: future })]
    expect(operativeSlotHead(rows, '2026-08-25', 'morning')?.id).toBe(1)
  })

  it('a withdrawn head vacates the slot even with older published revisions beneath', () => {
    const parent = row({})
    const correction = row({
      status: 'withdrawn',
      revision: 2,
      supersedes: parent.id,
      withdrawnAt: past,
    })
    expect(operativeHeads([parent, correction]).size).toBe(0)
  })
})

describe('visible heads (the public state)', () => {
  it('a published row is visible once its issue time arrives', () => {
    const rows = [row({})]
    expect(visibleHeads(rows, NOW).get('2026-08-25|morning')?.id).toBe(1)
  })

  it('drafts are never visible', () => {
    expect(visibleHeads([row({ status: 'draft' })], NOW).size).toBe(0)
  })

  it('an embargoed (scheduled) row is not yet visible — the older revision keeps serving', () => {
    const parent = row({ issuedAt: earlier })
    const scheduled = row({ revision: 2, supersedes: parent.id, issuedAt: future })
    const heads = visibleHeads([parent, scheduled], NOW)
    expect(heads.get('2026-08-25|morning')?.id).toBe(parent.id)
    // Once the issue time arrives, the correction takes over.
    const later = new Date('2026-08-26T00:00:00Z')
    expect(visibleHeads([parent, scheduled], later).get('2026-08-25|morning')?.id).toBe(
      scheduled.id,
    )
  })

  it('a live correction supersedes its parent by creation order', () => {
    const parent = row({ issuedAt: earlier })
    const correction = row({ revision: 2, supersedes: parent.id })
    expect(visibleHeads([parent, correction], NOW).get('2026-08-25|morning')?.id).toBe(
      correction.id,
    )
  })

  it('withdrawing a live head hides the whole issuance — older revisions never resurface', () => {
    const parent = row({ issuedAt: earlier })
    const correction = row({
      status: 'withdrawn',
      revision: 2,
      supersedes: parent.id,
      issuedAt: past,
      withdrawnAt: '2026-08-25T15:00:00.000Z',
    })
    expect(visibleHeads([parent, correction], NOW).size).toBe(0)
  })

  it('withdrawing a row that never went live is a non-event', () => {
    const parent = row({ issuedAt: earlier })
    // Scheduled for the future, withdrawn before its issue time arrived.
    const scheduled = row({
      status: 'withdrawn',
      revision: 2,
      supersedes: parent.id,
      issuedAt: future,
      withdrawnAt: past,
    })
    expect(visibleHeads([parent, scheduled], NOW).get('2026-08-25|morning')?.id).toBe(parent.id)
  })

  it('a fresh forecast published after a withdrawal wins despite restarting at revision 1', () => {
    const original = row({ issuedAt: earlier })
    const withdrawn = row({
      status: 'withdrawn',
      revision: 2,
      supersedes: original.id,
      issuedAt: past,
      withdrawnAt: past,
    })
    const fresh = row({ revision: 1 })
    expect(visibleHeads([original, withdrawn, fresh], NOW).get('2026-08-25|morning')?.id).toBe(
      fresh.id,
    )
  })
})

describe('visibleForDate (the stacked public view)', () => {
  it('returns at most one head per issuance, newest issued first', () => {
    const am = row({ issuance: 'morning', issuedAt: earlier })
    const pm = row({ issuance: 'afternoon', issuedAt: past })
    const out = visibleForDate([am, pm], { now: NOW })
    expect(out.map((r) => r.id)).toEqual([pm.id, am.id])
  })

  it('a withdrawn PM falls back to the AM — never to an older PM revision', () => {
    const am = row({ issuance: 'morning', issuedAt: earlier })
    const pm = row({ issuance: 'afternoon', issuedAt: past })
    const pmWithdrawal = row({
      issuance: 'afternoon',
      status: 'withdrawn',
      revision: 2,
      supersedes: pm.id,
      issuedAt: past,
      withdrawnAt: '2026-08-25T16:00:00.000Z',
    })
    const out = visibleForDate([am, pm, pmWithdrawal], { now: NOW })
    expect(out.map((r) => r.id)).toEqual([am.id])
  })

  it('no date given → the latest service date with visible content', () => {
    const yesterday = row({ serviceDate: '2026-08-24', issuedAt: earlier })
    const today = row({ issuedAt: past })
    // A newer service date whose only row is embargoed does not steal the view.
    const tomorrowEmbargoed = row({ serviceDate: '2026-08-26', issuedAt: future })
    const out = visibleForDate([yesterday, today, tomorrowEmbargoed], { now: NOW })
    expect(out.map((r) => r.id)).toEqual([today.id])
    expect(visibleForDate([yesterday], { now: NOW }).map((r) => r.id)).toEqual([yesterday.id])
  })

  it('an explicit date returns that date only', () => {
    const yesterday = row({ serviceDate: '2026-08-24', issuedAt: earlier })
    const today = row({ issuedAt: past })
    expect(
      visibleForDate([yesterday, today], { date: '2026-08-24', now: NOW }).map((r) => r.id),
    ).toEqual([yesterday.id])
  })
})

describe('latestVisibleHead (the current forecast)', () => {
  it('is the newest visible head across service dates', () => {
    const yesterday = row({ serviceDate: '2026-08-24', issuedAt: earlier })
    const today = row({ issuedAt: past })
    expect(latestVisibleHead([yesterday, today], NOW)?.id).toBe(today.id)
  })

  it('is null when nothing is visible', () => {
    expect(latestVisibleHead([row({ issuedAt: future })], NOW)).toBeNull()
  })
})
