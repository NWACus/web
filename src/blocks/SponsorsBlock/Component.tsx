import { ImageMedia } from '@/components/Media/ImageMedia'
import { SponsorsBlock as SponsorsBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

export const SponsorsBlock = (props: SponsorsBlockProps) => {
  const { backgroundColor, sponsors, title } = props

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className="container py-16">
      {title && (
        <div className={`${bgColorClass} prose md:prose-md py-2 text-center max-w-none`}>
          <h2 className={textColor}>{title}</h2>
        </div>
      )}
      <div className="flex flex-wrap justify-evenly items-center">
        {typeof sponsors === 'object' &&
          sponsors.map((sponsor, index: number) => {
            if (typeof sponsor === 'object')
              return (
                <div className="w-1/2 md:w-1/3 lg:w-1/5 p-10" key={index}>
                  <a href={sponsor.link} target="_blank">
                    <ImageMedia
                      imgClassName="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-in-out overflow-hidden"
                      resource={sponsor.photo}
                    />
                  </a>
                </div>
              )
          })}
      </div>
    </div>
  )
}
