'use client'

/**
 * Loads the danger map in the browser only.
 *
 * A `'use client'` component is still rendered on the server to produce the initial HTML, and both
 * map libraries refuse to be: `@mapbox/search-js-web` registers its custom element by touching
 * `document` at module scope, so merely importing it server-side throws `document is not defined`.
 * `ssr: false` keeps the whole subtree out of the server render.
 *
 * This wrapper exists because `ssr: false` is only allowed inside a client component, and the
 * map's host (`HomeDangerMap`) is a server component that has server-rendered content of its own to
 * hand down. Props — including the server-rendered legend — pass straight through.
 */
import dynamic from 'next/dynamic'

import type { DangerMapProps } from './DangerMap.client'

const DangerMap = dynamic(() => import('./DangerMap.client').then((mod) => mod.DangerMap), {
  ssr: false,
})

export function DangerMapLoader(props: DangerMapProps) {
  return <DangerMap {...props} />
}
