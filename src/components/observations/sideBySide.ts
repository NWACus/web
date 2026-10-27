/**
 * The one breakpoint the viewer has: from Tailwind's `lg` the map and list sit side by side, and
 * the map takes hover (popups, the zone card) and offers to expand; under it the phone layout and
 * taps. The layout's `lg:` classes and these checks must agree, so both read this. The widget
 * switched at 992px; `lg` is the nearest of the site's breakpoints.
 */
import { cssVariables } from '@/cssVariables'

export const SIDE_BY_SIDE_WIDTH = cssVariables.breakpoints.lg

export function isSideBySide(): boolean {
  return window.matchMedia(`(min-width: ${SIDE_BY_SIDE_WIDTH}px)`).matches
}
