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
import Autoplay from 'embla-carousel-autoplay'

export const SponsorsBlockCarousel = ({ sponsors }: { sponsors: Sponsor[] }) => {
  return (
    <div>
      <div className="container">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 2000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {sponsors?.map((sponsor, index) => (
              <CarouselItem
                className="basis-1/2 md:basis-1/3 lg:basis-1/6 flex aspect-square items-center justify-center p-4"
                key={`${sponsor.id}_${index}`}
              >
                <a href={sponsor.link} target="_blank" rel="noopener noreferrer">
                  <ImageMedia
                    imgClassName="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-in-out overflow-hidden"
                    resource={sponsor.photo}
                  />
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  )
}
