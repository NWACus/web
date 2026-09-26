import type { CollectionConfig } from 'payload'

import { accessBySharedContent } from '@/access/bySharedContent'
import { SHARED_CONTENT_ADMIN_GROUP, SHARED_CONTENT_EDIT_CONTROLS } from '@/constants/sharedContent'
import { canReadSharedContent } from '@/utilities/rbac/canReadSharedContent'
import { validateExternalUrl } from '@/utilities/validateUrl'
import { rejectClaimedMatches } from './hooks/rejectClaimedMatches'
import { revalidateGlossary, revalidateGlossaryDelete } from './hooks/revalidateGlossary'

// Standard avalanche terms marked in native forecast prose. Shared Content (ADR 022); how the
// terms reach the page without entering its cache is ADR 018.
export const GlossaryTerms: CollectionConfig = {
  slug: 'glossaryTerms',
  labels: {
    singular: 'Glossary Term',
    plural: 'Glossary Terms',
  },
  access: accessBySharedContent('glossaryTerms'),
  admin: {
    group: SHARED_CONTENT_ADMIN_GROUP,
    useAsTitle: 'term',
    defaultColumns: ['term', 'aliases', 'definition'],
    listSearchableFields: ['term', 'aliases', 'definition'],
    components: {
      edit: {
        beforeDocumentControls: SHARED_CONTENT_EDIT_CONTROLS,
      },
    },
    hidden: ({ user }) => !canReadSharedContent({ collection: 'glossaryTerms', user }),
    description:
      'Terms underlined in forecast text on every center whose forecast has the glossary turned on. Hovering or tapping one shows its definition.',
  },
  defaultSort: 'term',
  fields: [
    {
      name: 'term',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The term as it should be matched in forecast text. Matching ignores case.',
      },
    },
    {
      name: 'aliases',
      type: 'text',
      hasMany: true,
      admin: {
        description:
          'Other forms that should show the same definition: plurals, tenses, synonyms (e.g. "beacon" for "transceiver"). A term or alias can belong to only one Glossary Term.',
      },
    },
    {
      name: 'definition',
      type: 'textarea',
      required: true,
    },
    {
      name: 'link',
      type: 'text',
      validate: validateExternalUrl,
      admin: {
        description:
          'Optional page on avalanche.org to learn more. Shown as a "Learn more" link under the definition.',
      },
    },
  ],
  hooks: {
    beforeValidate: [rejectClaimedMatches],
    afterChange: [revalidateGlossary],
    afterDelete: [revalidateGlossaryDelete],
  },
}
