import { EmbedFrame } from '@/components/EmbedFrame'
import { BASE_ADD_ATTR } from '@/components/EmbedFrame/policies'
import type { VideoEmbedBlock as VideoEmbedBlockProps } from 'src/payload-types'

type Props = VideoEmbedBlockProps & {
  isLayoutBlock: boolean
  className?: string
}
const VIDEO_EMBED_POLICY = {
  addTags: ['iframe', 'style'],
  addAttr: BASE_ADD_ATTR,
  sandbox:
    'allow-scripts allow-presentation allow-same-origin allow-popups allow-popups-to-escape-sandbox',
}

export const VideoEmbedBlockComponent = (props: Props) => (
  <EmbedFrame {...props} {...VIDEO_EMBED_POLICY} />
)
