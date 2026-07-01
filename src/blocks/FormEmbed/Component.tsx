import { EmbedFrame } from '@/components/EmbedFrame'
import { BASE_ADD_ATTR } from '@/components/EmbedFrame/policies'
import type { FormEmbedBlock as FormEmbedBlockProps } from 'src/payload-types'

type Props = FormEmbedBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

const FORM_EMBED_POLICY = {
  addTags: ['iframe', 'script', 'style', 'dbox-widget'],
  addAttr: [...BASE_ADD_ATTR, 'allowpaymentrequest', 'campaign', 'enable-auto-scroll'],
  sandbox:
    'allow-scripts allow-presentation allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox',
}

export const FormEmbedBlockComponent = (props: Props) => (
  <EmbedFrame {...props} {...FORM_EMBED_POLICY} />
)
