import { Media } from '@/components/Media'
import { MediaAvatar } from '@/components/Media/AvatarImageMedia'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Biography } from '@/payload-types'
import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import { format, parseISO } from 'date-fns'
import type { Payload } from 'payload'

export const TeamBio = ({ biography, payload }: { biography: Biography; payload: Payload }) => {
  // For live preview when bio not selected
  if (!biography) return null

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

  return biography.biography ? (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center justify-center cursor-pointer hover:underline">
          <div className="p-6 flex flex-col items-center space-y-4">
            {BiographyAvatar}
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-semibold">{name}</h3>
              {biography.title && (
                <h2 className="text-sm text-muted-foreground">{biography.title}</h2>
              )}
              {biography.start_date && (
                <p className="text-sm italic text-muted-foreground">
                  Since {format(parseISO(biography.start_date), 'MMMM yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="flex flex-col items-center">
          <Media resource={biography.photo} className="h-32 w-32" />
          <DialogTitle>{name}</DialogTitle>
          <p className="text-sm font-medium text-muted-foreground">{biography.title}</p>
        </DialogHeader>
        <DialogDescription className="border-t pt-2">
          <p className="text-muted-foreground leading-relaxed">{biography.biography}</p>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  ) : (
    BiographyAvatar
  )
}
