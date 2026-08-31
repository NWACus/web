/**
 * Bottom line summary: highest danger icon + sanitized HTML.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dangerIconSize, dangerIconUrl } from '@/services/nac/dangerScale'
import type { DangerLevel } from '@/services/nac/model/forecast'

import { sanitizeHtml } from './sanitizeHtml'

interface BottomLineProps {
  html: string
  dangerLevel: DangerLevel
}

export function BottomLine({ html, dangerLevel }: BottomLineProps) {
  const iconSize = dangerIconSize(dangerLevel)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* Fixed height, auto width preserves the diamond's aspect ratio (icons 3–5 are wider);
              width/height attributes reserve the space so the title doesn't shift on load. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dangerIconUrl(dangerLevel)}
            alt=""
            width={iconSize.width}
            height={iconSize.height}
            className="h-8 w-auto"
            aria-hidden="true"
          />
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
