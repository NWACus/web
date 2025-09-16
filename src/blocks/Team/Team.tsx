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
        {teamMembers.map((member) => {
          const name: string =
            member.name || (typeof member.user === 'object' && member.user?.name) || 'Unknown'
          const initials = getAuthorInitials(name)
          return (
            <div className="w-full flex  justify-center" key={`bio__${member.id}`}>
              <div className="flex flex-col items-center space-y-4">
                <Dialog>
                  <DialogTrigger className="transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer">
                    <MediaAvatar
                      resource={member.photo}
                      fallback={initials}
                      className="h-48 w-48 mb-2"
                    />
                    <div className="text-center">
                      <p className="text-md">{name}</p>
                      {member.title && (
                        <p className="text-sm italic text-muted-foreground mb-1">{member.title}</p>
                      )}
                      {member.start_date && (
                        <p className="text-xs text-muted-foreground">
                          Since {format(parseISO(member.start_date), 'MMMM yyyy')}
                        </p>
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-h-screen max-w-3xl p-10 items-center overflow-y-scroll">
                    <DialogHeader className="flex flex-col text-left mx-auto">
                      <MediaAvatar
                        resource={member.photo}
                        fallback={initials}
                        className="h-72 w-72 mb-4"
                      />
                    </DialogHeader>
                    <div className="flex space-x-3">
                      <DialogTitle className="mb-1">{name}</DialogTitle>
                      <DialogDescription className="text-muted-foreground flex">
                        {member.title && <>{member.title}</>}
                        {member.start_date && (
                          <span className="italic">
                            &nbsp;&mdash; Since {format(parseISO(member.start_date), 'MMMM yyyy')}
                          </span>
                        )}
                      </DialogDescription>
                    </div>
                    <div className="text-muted-foreground leading-relaxed">{member.biography}</div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
