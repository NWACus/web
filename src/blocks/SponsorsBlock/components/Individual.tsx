'use client'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Sponsor } from '@/payload-types'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'

export const SponsorsBlockIndividual = ({ sponsors }: { sponsors: Sponsor[] }) => {
  return (
    <div className="container flex justify-center items-center">
      {sponsors.length === 1 ? (
        <a href={sponsors[0].link} target="_blank" className="w-full max-w-xs">
          <div className="p-4 md:p-10">
            <ImageMedia imgClassName="w-full h-auto overflow-hidden" resource={sponsors[0].photo} />
          </div>
        </a>
      ) : (
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 10000,
            }),
            Fade({}),
          ]}
          className="w-full max-w-xs"
        >
          <CarouselContent className="ml-0">
            {sponsors?.map((sponsor, index) => (
              <CarouselItem
                className="flex aspect-square items-center justify-center p-4"
                key={`${sponsor.id}_${index}`}
              >
                <a href={sponsor.link} target="_blank" rel="noopener noreferrer">
                  <ImageMedia
                    imgClassName="w-full h-auto overflow-hidden"
                    resource={sponsor.photo}
                  />
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  )
}
