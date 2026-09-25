/** The forecaster's synopsis and extended outlook, sanitized on the server. */
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
