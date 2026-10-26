/**
 * Bottom line summary, matching the legacy widget: the highest danger icon hangs off the card's
 * top-left corner, and the title sits in line with the text below it.
 */
import { GlossaryProse } from '@/components/glossary/GlossaryProse.client'
import { Card, CardContent } from '@/components/ui/card'
import {
  dangerIconSize,
  dangerIconUrl,
  dangerLevelLabel,
  travelAdvice,
} from '@/services/nac/dangerScale'
import type { DangerLevel } from '@/services/nac/model/forecast'
import { cn } from '@/utilities/ui'

import { sectionHeading } from './forecastHeadings'
import { forecastProse } from './forecastProse'
import { InfoPopover } from './InfoPopover'
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
    <div className="pt-5">
      <Card className="relative">
        {/* The widget's 60px box with 0.3rem padding: a 50px-tall icon, auto width preserving the
          diamond's aspect ratio (icons 3–5 are wider). On paper the card meets the page margin,
          which would clip the left overhang, so the icon sits inside the card's edge. */}
        <InfoPopover
          html={travelAdvice(dangerLevel)}
          label={`Travel advice for ${dangerLevelLabel(dangerLevel)}`}
          hint="Click to learn more"
          className="absolute -left-[15px] -top-[25px] z-[1] print:left-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dangerIconUrl(dangerLevel)}
            alt=""
            width={iconSize.width}
            height={iconSize.height}
            className="block h-[60px] w-auto max-w-none p-[0.3rem]"
          />
        </InfoPopover>
        <CardContent className="p-6 sm:p-8">
          <h2 className={sectionHeading}>The Bottom Line</h2>
          <GlossaryProse html={sanitizeHtml(html)} className={cn(forecastProse, 'mt-4')} />
        </CardContent>
      </Card>
    </div>
  )
}
