import { MediaAvatar } from '@/components/Media/AvatarImageMedia'
import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { format, parseISO } from 'date-fns'
import { Payload } from 'payload'
import type { BiographyBlock as BiographyBlockProps } from 'src/payload-types'

type Props = BiographyBlockProps & { payload: Payload }

export const BiographyBlock = ({ backgroundColor, biography, payload }: Props) => {
  // For live preview when bio not selected
  if (!biography) return null
  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)
  if (typeof biography !== 'object' || typeof biography.photo !== 'object') {
    payload.logger.error(
      `BiographyBlock got an unresolved biography reference: ${JSON.stringify(biography)}`,
    )
    return <></>
  }

  const name: string =
    biography.name || (typeof biography.user === 'object' && biography.user?.name) || 'Unknown'
  const initials = getAuthorInitials(name)

  const BiographyAvatar = (
    <MediaAvatar
      resource={biography.photo}
      fallback={initials}
      className="h-56 w-56 transition-transform duration-100 ease-in-out hover:scale-110 rounded-none"
    />
  )

  return (
    <div className={bgColorClass}>
      {biography.biography ? (
        <div className={`flex items-center justify-center ${textColor}`}>
          <div className="p-6 flex gap-x-8 items-center space-y-4">
            {BiographyAvatar}
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{name}</h3>
              {biography.title && (
                <h2 className="text-sm text-muted-foreground">{biography.title}</h2>
              )}

              {biography.start_date && (
                <p className="text-sm italic text-muted-foreground">
                  Since {format(parseISO(biography.start_date), 'MMMM yyyy')}
                </p>
              )}

              <div className="border-t pt-2">
                <p className="text-muted-foreground leading-relaxed">{biography.biography}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        BiographyAvatar
      )}
    </div>
  )
}
