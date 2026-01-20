import { SponsorsBlock as SponsorsBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { filterValidRelationships } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { endOfDay, startOfDay } from 'date-fns'
import { SponsorsBlockBanner } from './components/Banner'
import { SponsorsBlockCarousel } from './components/Carousel'
import { SponsorsBlockStatic } from './components/Static'

export const SponsorsBlockComponent = ({
  backgroundColor,
  sponsors,
  sponsorsLayout,
  wrapInContainer = false,
}: SponsorsBlockProps) => {
  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)
  const now = new Date()

  const validSponsors = filterValidRelationships(sponsors).filter(
    (sponsor) =>
      (!sponsor.startDate || startOfDay(new Date(sponsor.startDate)) <= now) &&
      (!sponsor.endDate || endOfDay(new Date(sponsor.endDate)) >= now),
  )

  if (validSponsors.length === 0) return null

  return (
    <div className={cn('py-10', bgColorClass, textColor, { container: wrapInContainer })}>
      <div className="flex flex-wrap justify-evenly items-center">
        {(() => {
          switch (sponsorsLayout) {
            case 'banner':
              return <SponsorsBlockBanner sponsors={validSponsors} />
            case 'carousel':
              return <SponsorsBlockCarousel bgColorClass={bgColorClass} sponsors={validSponsors} />
            case 'static':
              return <SponsorsBlockStatic sponsors={validSponsors} />
            default:
              return null
          }
        })()}
      </div>
    </div>
  )
}
