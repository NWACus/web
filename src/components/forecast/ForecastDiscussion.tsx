/**
 * Forecast discussion: sanitized HTML rendering.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </CardContent>
    </Card>
  )
}
