import { buttonField } from '@/fields/button'
import type { Block } from 'payload'

export const ButtonBlock: Block = {
  slug: 'buttonBlock',
  interfaceName: 'ButtonBlock',
  imageURL: '/thumbnail/ButtonThumbnail.jpg',
  fields: [buttonField(['default', 'secondary', 'ghost', 'outline'])],
}
