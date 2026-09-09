export type OgDocType = 'post' | 'event'

/**
 * Builds the dynamic OG image URL for a CMS document (blog post or event).
 *
 * The route re-fetches the document by center + slug, so a crawler that hits
 * this URL directly still gets a fresh, content-specific image without the
 * referring page.
 */
export function ogImageUrlForDoc(center: string, type: OgDocType, slug: string): string {
  const search = new URLSearchParams({ type, slug })
  return `/api/${center}/og?${search.toString()}`
}
