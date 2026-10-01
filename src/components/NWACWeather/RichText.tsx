/**
 * The forecaster's synopsis and extended outlook. Authored as rich text in the AFP dashboard, so
 * it is sanitized here on the server before it reaches the page.
 */
import { sanitizeHtml } from '@/components/forecast/sanitizeHtml'

/** Forecaster-authored HTML, or null when blank. */
export function textOrNull(html: string | null | undefined): string | null {
  return html?.trim() ? html : null
}

export function RichText({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}
