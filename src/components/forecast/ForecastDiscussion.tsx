/**
 * Forecast discussion: sanitized HTML rendering, as one section of the forecast panel.
 */
import { DiscussionBody } from './DiscussionBody'
import { sectionHeading } from './forecastHeadings'
import { sanitizeHtml } from './sanitizeHtml'

interface ForecastDiscussionProps {
  html: string
}

export function ForecastDiscussion({ html }: ForecastDiscussionProps) {
  return (
    <section className="space-y-4">
      <h2 className={sectionHeading}>Forecast Discussion</h2>
      {/* Sanitizing stays on the server; the body only renders it and wires up embedded media. */}
      <DiscussionBody html={sanitizeHtml(html)} />
    </section>
  )
}
