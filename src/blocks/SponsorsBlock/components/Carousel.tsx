'use client'
import { ImageMedia } from '@/components/Media/ImageMedia'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Sponsor } from '@/payload-types'
import { getImageWidthFromMaxHeight } from '@/utilities/getImageWidthFromMaxHeight'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import Autoplay from 'embla-carousel-autoplay'

export const SponsorsBlockCarousel = ({
  bgColorClass,
  sponsors,
}: {
  bgColorClass: string
  sponsors: Sponsor[]
}) => {
  const carouselItemClasses: { [key: string]: string[] } = {
    1: [''],
    2: [''],
    3: [''],
    4: ['sm:basis-1/2'],
    5: ['sm:basis-1/2 md:basis-1/3'],
    6: ['sm:basis-1/2 md:basis-1/3 lg:basis-1/4'],
    7: ['sm:basis-1/2 md:basis-1/3 lg:basis-1/5'],
    default: ['basis-1/2 md:basis-1/3 lg:basis-1/6'],
  }

  const carouselItemClass = carouselItemClasses[sponsors.length] || carouselItemClasses['default']
  const borderColor = getTextColorFromBgColor(bgColorClass).replace('text-bg', 'border')
  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 3000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
      >
        <CarouselContent className="-ml-6">
          {sponsors?.map((sponsor, index) => (
            <CarouselItem
              className={`${carouselItemClass} flex aspect-square items-center justify-center p-6 max-h-[200px]`}
              key={`${sponsor.id}_${index}`}
            >
              <a href={sponsor.link} target="_blank" rel="noopener noreferrer">
                <ImageMedia
                  imgClassName="w-full h-auto max-h-[200px] overflow-hidden"
                  resource={sponsor.photo}
                  size={getImageWidthFromMaxHeight(sponsor.photo, 200)}
                />
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className={`${bgColorClass} ${borderColor}`} />
        <CarouselNext className={`${bgColorClass} ${borderColor}`} />
      </Carousel>
    </div>
  )
}
