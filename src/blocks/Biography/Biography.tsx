import { format, parseISO } from 'date-fns'
import { Payload } from 'payload'
import type { BiographyBlock as BiographyBlockProps } from 'src/payload-types'

import { MediaAvatar } from '@/components/Media/AvatarImageMedia'
import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'

type Props = BiographyBlockProps & { payload: Payload }

export const BiographyBlock = ({ backgroundColor, biography, imageLayout, payload }: Props) => {
  // For live preview when bio not selected
  if (!biography) return null

  if (typeof biography !== 'object' || typeof biography.photo !== 'object') {
    payload.logger.error(
      `BiographyBlock got an unresolved biography reference: ${JSON.stringify(biography)}`,
    )
    return <></>
  }

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  const name: string = biography.name || 'Unknown'
  const initials = getAuthorInitials(name)

  return (
    <div className={`${bgColorClass}`}>
      <div className="container py-16">
        <div className="grid md:grid-cols-12 gap-x-6 gap-y-6">
          <div
            className={`items-center md:col-span-4 self-start ${imageLayout === 'right' ? 'order-last ms-6' : 'me-6 '}`}
          >
            <MediaAvatar
              resource={biography.photo}
              fallback={initials}
              className="h-auto w-full max-w-xs aspect-square object-cover"
            />
          </div>
          <div className={`md:col-span-8 self-center ${textColor}`}>
            <div className="prose mb-4">
              <h2 className="mb-0 font-normal leading-none">{name}</h2>
              {biography.title && <h3 className="italic font-normal mb-0">{biography.title}</h3>}
              {biography.start_date && (
                <p className="text-sm">
                  Since {format(parseISO(biography.start_date), 'MMMM yyyy')}
                </p>
              )}
            </div>
            {biography.biography && <p>{biography.biography}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
