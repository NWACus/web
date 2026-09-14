import { linkField } from '@/fields/linkField'

export const navLink = linkField({
  includeLabel: true,
  newTabDefaultsToChecked: true,
  labelDescriptionComponent:
    '@/fields/navLink/components/LinkLabelDescription#LinkLabelDescription',
})
