import { ImageMedia } from '@/components/Media/ImageMedia'
import { Sponsor } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { endOfDay, startOfDay } from 'date-fns'

type SponsorsBlockStaticProps = {
  bgColorClass: string
  className?: string
  sponsors: (number | Sponsor)[] | null
  textColor: string
  title?: string | null
  wrapInContainer?: boolean
}

export const SponsorsBlockStatic = ({
  bgColorClass,
  sponsors,
  textColor,
  title,
  wrapInContainer = true,
}: SponsorsBlockStaticProps) => {
  const now = new Date()
  const validSponsors = sponsors?.filter(
    (sponsor): sponsor is Sponsor =>
      typeof sponsor === 'object' &&
      sponsor &&
      (!sponsor.startDate || startOfDay(new Date(sponsor.startDate)) <= now) &&
      (!sponsor.endDate || endOfDay(new Date(sponsor.endDate)) >= now),
  )
  if (!validSponsors) return null

  const getColSpanName = () => {
    switch (validSponsors.length) {
      case 1:
      case 2:
        return 'w-2/3 md:w-2/3 lg:w-1/3'
      case 3:
        return 'w-1/2 md:w-1/2 lg:w-1/4'
      default:
        return 'w-1/3 md:w-1/3 lg:w-1/5'
    }
  }
  const colSpanName = getColSpanName()

  return (
    <div className={cn(wrapInContainer, 'py-10')}>
      {title && (
        <div className={`${bgColorClass} prose md:prose-md py-2 text-center max-w-none`}>
          <h2 className={textColor}>{title}</h2>
        </div>
      )}
      <div className="flex flex-wrap justify-evenly items-center">
        {typeof validSponsors === 'object' &&
          validSponsors.map((sponsor, index: number) => (
            <div className={`${colSpanName} p-4 md:p-10`} key={`${sponsor.id}_${index}`}>
              <a href={sponsor.link} target="_blank">
                <ImageMedia
                  imgClassName="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-in-out overflow-hidden"
                  resource={sponsor.photo}
                />
              </a>
            </div>
          ))}
      </div>
    </div>
  )
}
