import { getNativeProductFlag } from './getNativeProductFlag'

/**
 * Forecast-specific convenience wrapper over {@link getNativeProductFlag}.
 * Prefer `getNativeProductFlag(center, product)` for new call sites.
 */
export async function getUseNativeForecasts(centerSlug: string): Promise<boolean> {
  return getNativeProductFlag(centerSlug, 'forecast')
}
