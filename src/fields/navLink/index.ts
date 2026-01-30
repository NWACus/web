import { linkField } from '@/fields/linkField'

export const navLink = linkField({
  includeLabel: true,
  newTabForExternalOnly: true,
  labelDescriptionComponent:
    '@/fields/navLink/components/LinkLabelDescription#LinkLabelDescription',
})
