import { button } from '@/fields/button'
import type { Block } from 'payload'

export const ButtonsBlock: Block = {
  slug: 'buttonsBlock',
  interfaceName: 'ButtonsBlock',
  fields: [button(['default', 'secondary', 'destructive', 'ghost', 'link', 'outline'])],
}
