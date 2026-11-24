import { linkField } from '@/fields/linkField'

export const navLink = linkField({
  includeLabel: true,
  newTabDefaultsToChecked: true,
  labelDescriptionComponent:
    '@/fields/navLink/components/LinkLabelDescription#LinkLabelDescription',
  typeComponent: '@/fields/navLink/components/LinkTypeSwitch#LinkTypeSwitch',
  labels: { reference: 'Goes to', url: 'Web address', label: 'Menu text' },
})
