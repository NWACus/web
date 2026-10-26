/**
 * The server-side half of the expiry notice: decides whether the product had already lapsed when
 * this page rendered, and hands that answer to the client half to keep honest.
 *
 * It has to be a server component of its own. `ExpiryNotice` is `'use client'`, so computing
 * `Date.now()` inside it would run during the client's first render and disagree with the server's
 * HTML — the whole reason the initial answer is a prop.
 *
 * Every surface that shows a live product's danger rating should render this. Expiry is the one
 * piece of forecast state with no upstream event behind it: a product can lapse with no
 * replacement published, which produces no freshness change at all, so the revalidate-on-view path
 * correctly reports "nothing changed" and this is the viewer's only signal.
 */
import type { ForecastResult } from '@/services/nac/model/forecast'

import { ExpiryNotice } from './ExpiryNotice.client'

interface ProductExpiryProps {
  forecast: Pick<ForecastResult, 'expires_time'>
}

export function ProductExpiry({ forecast }: ProductExpiryProps) {
  // A product with no expiry never lapses, so there is nothing for the client to watch for.
  if (forecast.expires_time == null) return null

  return (
    <ExpiryNotice
      expiresTime={forecast.expires_time}
      initiallyExpired={Date.now() > new Date(forecast.expires_time).getTime()}
    />
  )
}
