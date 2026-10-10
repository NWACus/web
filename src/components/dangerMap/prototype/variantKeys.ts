/** PROTOTYPE ONLY — the `?variant=` keys, kept free of Mapbox imports (see SkinnyWidgets). */
export const VARIANTS = [
  { key: 'current', label: 'Current (baseline)', othersByDefault: null },
  { key: 'tilt', label: '3D camera tilt', othersByDefault: true },
  { key: 'terrain', label: '3D tilt + terrain', othersByDefault: true },
  { key: 'guide', label: 'Terrain + zone guide', othersByDefault: false },
  { key: 'centers', label: 'Own vs. other centers', othersByDefault: true },
  { key: 'skinny', label: 'Skinny map + list (old site)', othersByDefault: false },
  { key: 'skinny-widgets', label: 'Skinny, legacy widgets', othersByDefault: false },
] as const

export type VariantKey = (typeof VARIANTS)[number]['key']

export function isVariantKey(value: string | null): value is VariantKey {
  return VARIANTS.some((variant) => variant.key === value)
}
