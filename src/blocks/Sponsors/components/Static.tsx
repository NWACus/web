import { ImageMedia } from '@/components/Media/ImageMedia'
import { cssVariables } from '@/cssVariables'
import { Sponsor } from '@/payload-types'

const { breakpoints } = cssVariables

export const SponsorsBlockStatic = ({ sponsors }: { sponsors: Sponsor[] }) => {
  // Returns [className, sizes] based on sponsor count
  // Sizes calculated from width percentages: w-2/3=66vw, w-1/2=50vw, w-1/3=33vw, w-1/4=25vw, w-1/6=16vw
  const getColConfig = (): [string, string] => {
    switch (sponsors.length) {
      case 1:
      case 2:
        // w-2/3 md:w-2/3 lg:w-1/3
        return ['w-2/3 md:w-2/3 lg:w-1/3', `(min-width: ${breakpoints.lg}px) 33vw, 66vw`]
      case 3:
        // w-1/2 md:w-1/2 lg:w-1/4
        return ['w-1/2 md:w-1/2 lg:w-1/4', `(min-width: ${breakpoints.lg}px) 25vw, 50vw`]
      default:
        // w-1/3 md:w-1/3 lg:w-1/6
        return ['w-1/3 md:w-1/3 lg:w-1/6', `(min-width: ${breakpoints.lg}px) 16vw, 33vw`]
    }
  }
  const [colSpanName, sizes] = getColConfig()

  return (
    <>
      {typeof sponsors === 'object' &&
        sponsors.map((sponsor, index: number) => (
          <div className={`${colSpanName} p-4 md:px-8`} key={`${sponsor.id}_${index}`}>
            <a href={sponsor.link} target="_blank">
              <ImageMedia
                imgClassName="w-full h-auto overflow-hidden"
                resource={sponsor.photo}
                sizes={sizes}
              />
            </a>
          </div>
        ))}
    </>
  )
}
