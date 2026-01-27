import { clearIrrelevantLinkValues } from '@/utilities/clearIrrelevantLinkValues'
import { NamedGroupField } from 'payload'
import { linkToPageOrPost } from '../linkToPageOrPost'

export const navLink: NamedGroupField = {
  name: 'link',
  type: 'group',
  admin: {
    hideGutter: true,
  },
  hooks: {
    beforeChange: [clearIrrelevantLinkValues],
  },
  fields: linkToPageOrPost(true),
}
