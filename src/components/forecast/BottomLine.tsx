/**
 * Bottom line summary: highest danger icon + sanitized HTML.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dangerIconUrl } from '@/services/nac/dangerScale'
import type { DangerLevel } from '@/services/nac/types/forecastSchemas'

import { sanitizeHtml } from './sanitizeHtml'

interface BottomLineProps {
  html: string
  dangerLevel: DangerLevel
}

export function BottomLine({ html, dangerLevel }: BottomLineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dangerIconUrl(dangerLevel)} alt="" className="h-8 w-8" aria-hidden="true" />
          The Bottom Line
        </CardTitle>
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
