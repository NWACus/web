/**
 * Forecast discussion: sanitized HTML rendering.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { DiscussionBody } from './DiscussionBody'
import { sanitizeHtml } from './sanitizeHtml'

interface ForecastDiscussionProps {
  html: string
}

export function ForecastDiscussion({ html }: ForecastDiscussionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast Discussion</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Sanitizing stays on the server; the body only renders it and wires up embedded media. */}
        <DiscussionBody html={sanitizeHtml(html)} />
      </CardContent>
    </Card>
  )
}
