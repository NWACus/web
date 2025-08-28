import RichText from '@/components/RichText'

import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { Width } from '../Width'

export const Message = ({ message }: { message: SerializedEditorState }) => {
  return (
    <Width className="mx-2 my-12" width="100">
      {message && <RichText data={message} enableGutter={false} />}
    </Width>
  )
}
