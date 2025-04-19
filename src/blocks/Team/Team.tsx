import { BiographyBlock } from '@/blocks/Biography/Biography'
import type { Biography, TeamBlock as TeamBlockProps } from 'src/payload-types'

type Props = TeamBlockProps

export const TeamBlock = ({ team }: Props) => {
  if (typeof team !== 'object') {
    // TOOD: figure out how to handle this - do we have access to the Payload client?
    return <></>
  }

  const teamMembers: Biography[] = team.members.filter((member) => typeof member === 'object')

  return (
    <div className="container mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">{team.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member, index) => (
          <BiographyBlock key={index} biography={member} blockType={'biography'} />
        ))}
      </div>
    </div>
  )
}
