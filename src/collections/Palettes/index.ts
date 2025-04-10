import { accessByGlobalRole } from '@/access/byGlobalRole'
import { colorField } from '@/fields/ColorField'
import type { CollectionConfig } from 'payload'

export const Palettes: CollectionConfig = {
  slug: 'palettes',
  access: accessByGlobalRole('palettes'),
  admin: {
    useAsTitle: 'name',
    group: 'Branding',
  },
  // TODO: custom component to show off the color, with a picker or tailwind for choosing
  fields: [
    {
      name: 'name',
      type: 'text',
      unique: true,
      required: true,
    },
    {
      name: 'radius',
      type: 'text',
      required: true,
      // TODO: validate rem?
    },
    ...[
      'background',
      'foreground',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
      'primary',
      'primary-foreground',
      'secondary',
      'secondary-foreground',
      'muted',
      'muted-foreground',
      'accent',
      'accent-foreground',
      'destructive',
      'destructive-foreground',
      'border',
      'input',
      'ring',
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'chart-5',
    ].map((name) => colorField(name)),
  ],
}
