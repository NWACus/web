import type { NativeProduct } from '@/utilities/getNativeProductFlag'

/**
 * Products only these centers may turn on. Elsewhere the flag reads false whatever Settings says,
 * and the admin hides its toggle. Native NAC weather (the Mountain Weather page and archive tab)
 * is off for every center until it's ready; NWAC's own Mountain Weather Forecast needs no flag.
 */
const NATIVE_PRODUCT_CENTERS: Partial<Record<string, readonly string[]>> = {
  weather: [],
} satisfies Partial<Record<NativeProduct, readonly string[]>>

/** Takes any field name, so the admin checkbox can pass its own. */
export function isNativeProductAllowed(centerSlug: string, product: string): boolean {
  return NATIVE_PRODUCT_CENTERS[product]?.includes(centerSlug) ?? true
}
