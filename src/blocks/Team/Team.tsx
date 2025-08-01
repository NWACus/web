import { format, parseISO } from 'date-fns'
import { Payload } from 'payload'
import type { Biography, TeamBlock as TeamBlockProps } from 'src/payload-types'

import { MediaAvatar } from '@/components/Media/AvatarImageMedia'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getAuthorInitials } from '@/utilities/getAuthorInitials'

type Props = TeamBlockProps & { payload: Payload }

export const TeamBlock = ({ team, payload }: Props) => {
  // For live preview when team not selected
  if (!team) return null
  if (typeof team !== 'object') {
    payload.logger.error(`TeamBlock got an unresolved biography reference: ${JSON.stringify(team)}`)
    return <></>
  }

  const teamMembers: Biography[] = team.members.filter((member) => typeof member === 'object')

  return (
    <div className="container mx-auto mb-12">
      <h2 className="text-3xl font-semi-bold">{team.name}</h2>
      <hr className="mt-2 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {teamMembers.map((member, index) => {
          const name: string =
            member.name || (typeof member.user === 'object' && member.user?.name) || 'Unknown'
          const initials = getAuthorInitials(name)
          return (
            <div className="w-full flex  justify-center" key={index}>
              <div className="flex flex-col items-center space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
                      <MediaAvatar
                        resource={member.photo}
                        fallback={initials}
                        className="h-48 w-48 transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader className="flex flex-col items-center">
                      <MediaAvatar
                        resource={member.photo}
                        fallback={initials}
                        className="h-32 w-32"
                      />
                      <DialogTitle>{name}</DialogTitle>
                      <DialogDescription className=" text-sm font-medium text-muted-foreground">
                        {member.title}
                      </DialogDescription>
                    </DialogHeader>
                    <p className="border-t pt-2 text-muted-foreground leading-relaxed">
                      {member.biography}
                    </p>
                  </DialogContent>
                </Dialog>

                <div className="space-y-1 text-center">
                  <p className="text-md">{name}</p>
                  {member.title && (
                    <p className="text-sm italic text-muted-foreground">{member.title}</p>
                  )}
                  {member.start_date && (
                    <p className="text-xs text-muted-foreground">
                      Since {format(parseISO(member.start_date), 'MMMM yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
