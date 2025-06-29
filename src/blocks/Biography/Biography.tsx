import { MediaAvatar } from '@/components/Media/AvatarImageMedia'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getAuthorInitials } from '@/utilities/getAuthorInitials'
import { format, parseISO } from 'date-fns'
import { Payload } from 'payload'
import type { BiographyBlock as BiographyBlockProps } from 'src/payload-types'

type Props = BiographyBlockProps & { payload: Payload }

export const BiographyBlock = ({ biography, payload }: Props) => {
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
      className="h-24 w-24 transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer"
    />
  )

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {biography.biography ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
                  {BiographyAvatar}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-lg">{name}</h4>
                  <p className="text-sm font-medium text-muted-foreground">{biography.title}</p>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {biography.biography}
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            BiographyAvatar
          )}
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
      </CardContent>
    </Card>
  )
}
