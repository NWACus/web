import { button } from '@/fields/button'
import type { Block } from 'payload'

export const ButtonBlock: Block = {
  slug: 'buttonBlock',
  interfaceName: 'ButtonBlock',
  fields: [button(['default', 'secondary', 'destructive', 'ghost', 'link', 'outline'])],
}
