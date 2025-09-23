import { Sponsor, SponsorsBlock as SponsorsBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import { endOfDay, startOfDay } from 'date-fns'
import { SponsorsBlockCarousel } from './components/Carousel'
import { SponsorsBlockStatic } from './components/Static'

type SponsorsBlockComponentProps = SponsorsBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const SponsorsBlockComponent = ({
  backgroundColor,
  sponsorsSingle,
  sponsorsMulti,
  sponsorsLayout,
  title,
  wrapInContainer = true,
}: SponsorsBlockComponentProps) => {
  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)
  const now = new Date()
  const sponsors = ((sponsorsLayout === 'single' ? sponsorsSingle : sponsorsMulti) ??
    []) as Sponsor[]
  const validSponsors = sponsors.filter(
    (sponsor): sponsor is Sponsor =>
      (!sponsor.startDate || startOfDay(new Date(sponsor.startDate)) <= now) &&
      (!sponsor.endDate || endOfDay(new Date(sponsor.endDate)) >= now),
  )
  if (!validSponsors) return null

  return (
    <div className={cn(wrapInContainer, 'py-10')}>
      {title && (
        <div className={`${bgColorClass} prose md:prose-md py-2 text-center max-w-none`}>
          <h2 className={textColor}>{title}</h2>
        </div>
      )}
      <div className="flex flex-wrap justify-evenly items-center">
        {(() => {
          switch (sponsorsLayout) {
            case 'carousel':
              return <SponsorsBlockCarousel sponsors={validSponsors} />
            case 'static':
              return <SponsorsBlockStatic sponsors={validSponsors} />
            case 'single':
              return
            default:
              return null
          }
        })()}
      </div>
    </div>
  )
}
