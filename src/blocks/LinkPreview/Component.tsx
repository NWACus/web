import { blockSpacing } from '@/components/BackgroundColorWrapper'
import { ButtonLink } from '@/components/ButtonLink'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { LinkPreviewBlock as LinkPreviewBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'

export const LinkPreviewBlockComponent = (props: LinkPreviewBlockProps) => {
  const { backgroundColor, cards, header } = props

  const numOfCols = cards?.length ?? 2

  const colsClasses: { [key: number]: string } = {
    2: 'lg:col-span-6',
    3: 'lg:col-span-4',
  }
  const colsSpanClass = colsClasses[numOfCols]

  const textColor = getTextColorFromBgColor(backgroundColor)
  const spacing = blockSpacing(backgroundColor, true)

  return (
    <div className={cn(spacing.outer, spacing.bg)}>
      <div className={cn('container', spacing.inner)}>
        {header && (
          <div>
            <RichText className={`mb-4 ${textColor}`} data={header} enableGutter={false} />
          </div>
        )}
        <div className="grid grid-cols-4 lg:grid-cols-12 gap-x-4">
          {cards &&
            cards.length > 0 &&
            cards.map((card, index) => {
              const { image, button, text, title } = card
              const lastOddElement = numOfCols % 2 && index === numOfCols - 1
              return (
                <Card
                  className={cn(
                    `grid col-span-4 sm:col-span-2 my-2 ${colsSpanClass} ${lastOddElement && 'sm:col-start-2'} `,
                  )}
                  key={`link-prev__${card.id}`}
                >
                  {image && (
                    <CardHeader className="overflow-hidden">
                      <Media
                        pictureClassName="w-full flex justify-center bg-muted"
                        imgClassName="h-[200px] w-full object-cover"
                        resource={image}
                      />
                    </CardHeader>
                  )}
                  <CardContent>
                    <div className="flex flex-col justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription className="mt-2">{text}</CardDescription>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <ButtonLink {...button} />
                  </CardFooter>
                </Card>
              )
            })}
        </div>
      </div>
    </div>
  )
}
