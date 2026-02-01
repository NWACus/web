import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { SponsorsBlock as SponsorsBlockProps } from '@/payload-types'
import { filterValidRelationships } from '@/utilities/relationships'
import { endOfDay, startOfDay } from 'date-fns'
import { SponsorsBlockBanner } from './Banner'
import { SponsorsBlockCarousel } from './Carousel'
import { SponsorsBlockStatic } from './Static'

type Props = SponsorsBlockProps & {
  isLexical: boolean
}
export const SponsorsBlockComponent = ({
  backgroundColor,
  sponsors,
  sponsorsLayout,
  isLexical = false,
}: Props) => {
  const now = new Date()

  const validSponsors = filterValidRelationships(sponsors).filter(
    (sponsor) =>
      (!sponsor.startDate || startOfDay(new Date(sponsor.startDate)) <= now) &&
      (!sponsor.endDate || endOfDay(new Date(sponsor.endDate)) >= now),
  )

  if (validSponsors.length === 0) return null

  return (
    <BackgroundColorWrapper backgroundColor={backgroundColor} isLexical={isLexical}>
      <div className="flex flex-wrap justify-evenly items-center">
        {(() => {
          switch (sponsorsLayout) {
            case 'banner':
              return <SponsorsBlockBanner sponsors={validSponsors} />
            case 'carousel':
              return (
                <SponsorsBlockCarousel backgroundColor={backgroundColor} sponsors={validSponsors} />
              )
            case 'static':
              return <SponsorsBlockStatic sponsors={validSponsors} />
            default:
              return null
          }
        })()}
      </div>
    </BackgroundColorWrapper>
  )
}
