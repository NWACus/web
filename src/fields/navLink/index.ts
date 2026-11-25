import { linkField } from '@/fields/linkField'

export const navLink = linkField({
  includeLabel: true,
  newTabDefaultsToChecked: true,
  labelDescriptionComponent:
    '@/fields/navLink/components/LinkLabelDescription#LinkLabelDescription',
  typeComponent: '@/fields/navLink/components/LinkTypeRadio#LinkTypeRadio',
  labelComponent: '@/fields/navLink/components/LinkLabelField#LinkLabelField',
  labels: { reference: 'Page or post', url: 'Web address', label: 'Menu text' },
})
