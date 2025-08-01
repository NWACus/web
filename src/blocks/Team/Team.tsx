import { BiographyBlock } from '@/blocks/Biography/Biography'
import { Payload } from 'payload'
import type { Biography, TeamBlock as TeamBlockProps } from 'src/payload-types'

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
    <div className="container mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">{team.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamMembers.map((member, index) => (
          <BiographyBlock
            key={index}
            biography={member}
            blockType={'biography'}
            payload={payload}
          />
        ))}
      </div>
    </div>
  )
}
