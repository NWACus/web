import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostPreview } from '@/components/PostPreview'
import { cn } from '@/utilities/ui'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export type RelatedPostsProps = {
  className?: string
  docs?: Post[]
  introContent?: SerializedEditorState
}

export const RelatedPosts = (props: RelatedPostsProps) => {
  const { className, docs, introContent } = props

  return (
    <div className={cn('container', className)}>
      {introContent && <RichText data={introContent} enableGutter={false} />}

      {docs?.map((doc, index) => (
        <PostPreview key={`${doc.id}__${index}`} doc={doc} className="max-w-md" />
      ))}
    </div>
  )
}
