import type { BuiltInPage, Page, Post, StationPage } from '@/payload-types'

export const referenceDocTitle = (doc: BuiltInPage | Page | Post | StationPage): string =>
  'displayName' in doc ? doc.displayName : doc.title
