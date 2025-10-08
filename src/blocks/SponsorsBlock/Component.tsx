import { Sponsor, SponsorsBlock as SponsorsBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
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
  const validSponsors = sponsors.filter(
    (sponsor): sponsor is Sponsor =>
      typeof sponsor === 'object' &&
      sponsor !== null &&
      (!sponsor.startDate || startOfDay(new Date(sponsor.startDate)) <= now) &&
      (!sponsor.endDate || endOfDay(new Date(sponsor.endDate)) >= now),
  )
  if (!validSponsors) return null

  if (validSponsors.length === 1) {
    const validSponsor = validSponsors[0]
    if (
      validSponsor.photo &&
      typeof validSponsor.photo === 'object' &&
      validSponsor.photo.width &&
      validSponsor.photo.height
    ) {
      const ratio = validSponsor.photo.width / validSponsor.photo.height
      const minWidthRatio = 6

      if (ratio >= minWidthRatio) {
        sponsorsLayout = 'banner'
      }
    }
  }

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
