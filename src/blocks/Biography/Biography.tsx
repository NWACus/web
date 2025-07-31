import { MediaAvatar } from '@/components/Media/AvatarImageMedia'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import { format, parseISO } from 'date-fns'
import { Payload } from 'payload'
import type { BiographyBlock as BiographyBlockProps } from 'src/payload-types'

type Props = BiographyBlockProps & { payload: Payload }

export const BiographyBlock = ({ biography, payload }: Props) => {
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
      className="h-32 w-32 transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer"
    />
  )

  return (
    <Card className="w-full flex items-center justify-center">
      <CardContent className="p-6 flex flex-col items-center space-y-4">
        {biography.biography ? (
          <Dialog>
            <DialogTrigger asChild>
              <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
                {BiographyAvatar}
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="flex flex-col items-center">
                <MediaAvatar resource={biography.photo} fallback={initials} className="h-32 w-32" />
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
        )}
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-semibold">{name}</h3>
          {biography.title && <h2 className="text-sm text-muted-foreground">{biography.title}</h2>}
          {biography.start_date && (
            <p className="text-sm italic text-muted-foreground">
              Since {format(parseISO(biography.start_date), 'MMMM yyyy')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
