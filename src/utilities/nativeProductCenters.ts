import type { NativeProduct } from '@/utilities/getNativeProductFlag'

/**
 * Products only these centers may turn on. Elsewhere the flag reads false whatever Settings says,
 * and the admin hides its toggle. `weather` is NWAC's own Mountain Weather Forecast for now; the
 * native NAC weather page and archive tab stay off for other centers until they're ready.
 */
const NATIVE_PRODUCT_CENTERS: Partial<Record<string, readonly string[]>> = {
  weather: ['nwac'],
} satisfies Partial<Record<NativeProduct, readonly string[]>>

/** Takes any field name, so the admin checkbox can pass its own. */
export function isNativeProductAllowed(centerSlug: string, product: string): boolean {
  return NATIVE_PRODUCT_CENTERS[product]?.includes(centerSlug) ?? true
}
