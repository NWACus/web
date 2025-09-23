import { SponsorsBlock as SponsorsBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { SponsorsBlockStatic } from './components/Static'

type SponsorsBlockComponentProps = SponsorsBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const SponsorsBlockComponent = ({
  backgroundColor,
  sponsorsSingle,
  sponsorsMulti,
  sponsorsLayout,
  title,
  wrapInContainer = true,
}: SponsorsBlockComponentProps) => {
  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <>
      {(() => {
        switch (sponsorsLayout) {
          case 'carousel':
            return
          case 'static':
            return (
              <SponsorsBlockStatic
                sponsors={sponsorsMulti ?? []}
                bgColorClass={bgColorClass}
                textColor={textColor}
                title={title}
                wrapInContainer={wrapInContainer}
              />
            )
          case 'single':
            return
          default:
            return null
        }
      })()}
    </>
  )
}
