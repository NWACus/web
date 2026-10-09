import { cn } from '@/utilities/ui'

import { InfoPopover } from './InfoPopover'
import { sectionHeading } from './forecastHeadings'

interface HelpHeadingProps {
  title: string
  /** Trusted help HTML (see `forecastHelp.ts`). */
  help: string
  /** The ⓘ's accessible name. */
  helpLabel: string
  className?: string
}

/**
 * A panel section's heading with the widget's ⓘ beside it. The ⓘ sits outside the `h2` so the
 * heading's accessible name stays its title.
 */
export function HelpHeading({ title, help, helpLabel, className }: HelpHeadingProps) {
  return (
    <div className={className}>
      <h2 className={cn(sectionHeading, 'inline')}>{title}</h2>
      <InfoPopover html={help} label={helpLabel} />
    </div>
  )
}
