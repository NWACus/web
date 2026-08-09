import { ImageMedia } from '@/components/Media/ImageMedia'
import { Sponsor } from '@/payload-types'
import { SponsorLink } from './SponsorLink'

export const SponsorsBlockBanner = ({ sponsors }: { sponsors: Sponsor[] }) => {
  return sponsors?.map((sponsor, index) => (
    <SponsorLink sponsor={sponsor} className="w-full" key={`${sponsor.id}_${index}`}>
      <ImageMedia
        imgClassName="w-full h-auto overflow-hidden"
        resource={sponsor.photo}
        sizes="100vw"
      />
    </SponsorLink>
  ))
}
