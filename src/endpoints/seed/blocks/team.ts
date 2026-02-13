import type { Team } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const teamBlock = (team: Team): RequiredDataFromCollectionSlug<'pages'>['layout'][0] => ({
  blockType: 'team',
  team: team.id,
})
