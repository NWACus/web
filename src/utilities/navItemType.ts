import { isRecord } from '@/utilities/isRecord'

export type NavItemType = 'link' | 'section'

/** A nav item with sub-items is a section header; anything else is a link. */
export const itemTypeOf = (item: unknown): NavItemType =>
  isRecord(item) && Array.isArray(item.items) && item.items.length > 0 ? 'section' : 'link'
