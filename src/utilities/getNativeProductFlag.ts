import { getCenterSettings } from './getCenterSettings'

/** Products with a per-tenant native-vs-widget rollout flag (Control 1). */
export type NativeProduct = 'forecast' | 'warning' | 'dangerMap' | 'weather' | 'stationMap'

/**
 * Reads the per-tenant × per-product native rollout flag from Settings.
 * Returns false when the setting or product flag is not set (widget stays the default).
 */
export async function getNativeProductFlag(
  centerSlug: string,
  product: NativeProduct,
): Promise<boolean> {
  const settings = await getCenterSettings(centerSlug)
  return settings?.nativeProducts?.[product] ?? false
}
