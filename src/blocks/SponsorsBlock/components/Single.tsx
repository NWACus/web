import { ImageMedia } from '@/components/Media/ImageMedia'
import { Sponsor } from '@/payload-types'

export const SponsorsBlockSingle = ({ sponsor }: { sponsor: Sponsor }) => {
  return (
    <a
      href={sponsor.link}
      target="_blank"
      className="w-1/2 md:w-1/2 lg:w-1/4 p-4 flex aspect-square items-center justify-center"
    >
      <ImageMedia
        imgClassName="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-in-out overflow-hidden"
        resource={sponsor.photo}
      />
    </a>
  )
}
