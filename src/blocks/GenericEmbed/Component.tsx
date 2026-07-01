import { EmbedFrame } from '@/components/EmbedFrame'
import { BASE_ADD_ATTR } from '@/components/EmbedFrame/policies'
import type { GenericEmbedBlock as GenericEmbedBlockProps } from 'src/payload-types'

type Props = GenericEmbedBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

const GENERIC_EMBED_POLICY = {
  addTags: ['iframe', 'script', 'style'],
  addAttr: BASE_ADD_ATTR,
  sandbox:
    'allow-scripts allow-presentation allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox',
}

export const GenericEmbedBlockComponent = (props: Props) => (
  <EmbedFrame {...props} {...GENERIC_EMBED_POLICY} />
)
