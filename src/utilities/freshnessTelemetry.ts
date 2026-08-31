/**
 * Reporting for the freshness system's one deliberately silent outcome.
 *
 * *Indeterminate* means we could not establish the current product, so nothing on screen changes
 * and nothing is purged — which is the right call, and also means it is the one failure here that
 * nobody would ever notice. There is no 5xx, no page error, no visible degradation: if the NAC API
 * is down for an hour, every open tab quietly holds its last-known-good product and the system
 * looks healthy from the outside. The answers themselves are correct; not knowing they are
 * happening is the problem.
 *
 * Two things shape how this reports:
 *
 * - **It is throttled, hard.** Under a real outage *every* viewer's check goes indeterminate, and
 *   the useful signal is "this is happening, to this center", not one event per request. Sentry
 *   has no `sampleRate` configured in `sentry-base-config`, so an unthrottled report here would be
 *   the loudest thing in the project at exactly the moment it needs to be legible.
 * - **Only genuine failures reach it.** Some indeterminate answers are a normal steady state — an
 *   off-season zone with nothing published asks about it all day — and reporting those would bury
 *   the ones that matter. The call sites decide; see each one.
 */
import * as Sentry from '@sentry/nextjs'

import { createCooldown } from './cooldown'

/**
 * Why a freshness check could not establish the current product. Distinct causes rather than one
 * message because they fail differently: a zone list that throws is an outage, an alert that has
 * gone missing is a suspected blip on one zone's request.
 */
export type IndeterminateCause =
  | 'zones-unreachable'
  | 'no-fresh-forecast'
  | 'warning-vanished'
  | 'warnings-unreachable'

/** One report per cause per center per window. See the note above on why this is not optional. */
const REPORT_COOLDOWN_MS = 60_000

const allowReport = createCooldown(REPORT_COOLDOWN_MS)

export function reportIndeterminate(cause: IndeterminateCause, center: string): void {
  if (!allowReport(`${cause}:${center}`)) return

  Sentry.captureMessage(`Freshness check indeterminate: ${cause}`, {
    level: 'warning',
    tags: { freshness_cause: cause, center },
  })
}
