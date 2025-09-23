import { ImageMedia } from '@/components/Media/ImageMedia'
import { Sponsor } from '@/payload-types'

export const SponsorsBlockStatic = ({ sponsors }: { sponsors: Sponsor[] }) => {
  const getColSpanName = () => {
    switch (sponsors.length) {
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
    <>
      {typeof sponsors === 'object' &&
        sponsors.map((sponsor, index: number) => (
          <div className={`${colSpanName} p-4 md:p-10`} key={`${sponsor.id}_${index}`}>
            <a href={sponsor.link} target="_blank">
              <ImageMedia
                imgClassName="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-in-out overflow-hidden"
                resource={sponsor.photo}
              />
            </a>
          </div>
        ))}
    </>
  )
}
