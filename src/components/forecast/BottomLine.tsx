/**
 * Bottom line summary, matching the legacy widget: the highest danger icon hangs off the card's
 * top-left corner, and the title sits in line with the text below it.
 */
import { GlossaryProse } from '@/components/glossary/GlossaryProse.client'
import { Card, CardContent } from '@/components/ui/card'
import { dangerIconSize, dangerIconUrl } from '@/services/nac/dangerScale'
import type { DangerLevel } from '@/services/nac/model/forecast'

import { sectionHeading } from './forecastHeadings'
import { sanitizeHtml } from './sanitizeHtml'

interface BottomLineProps {
  html: string
  dangerLevel: DangerLevel
}

export function BottomLine({ html, dangerLevel }: BottomLineProps) {
  const iconSize = dangerIconSize(dangerLevel)
  return (
    // Padding, not margin, for the room the overhanging icon needs: a parent's `space-y-*`
    // overrides a child's top margin.
    <div className="pt-8">
      <Card className="relative">
        {/* The widget's 60px box with 0.3rem padding: a 50px-tall icon, auto width preserving the
          diamond's aspect ratio (icons 3–5 are wider). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dangerIconUrl(dangerLevel)}
          alt=""
          width={iconSize.width}
          height={iconSize.height}
          className="absolute -left-[15px] -top-[25px] h-[60px] w-auto max-w-none p-[0.3rem]"
          aria-hidden="true"
        />
        <CardContent className="p-6 sm:p-8">
          <h2 className={sectionHeading}>The Bottom Line</h2>
          <GlossaryProse
            html={sanitizeHtml(html)}
            className="prose mt-4 max-w-none dark:prose-invert"
          />
        </CardContent>
      </Card>
    </div>
  )
}
