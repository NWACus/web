import RichText from '@/components/RichText'
import clsx from 'clsx'

import type { Post } from '@/payload-types'

import { Card } from '@/components/Card'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export type RelatedPostsProps = {
  className?: string
  docs?: Post[]
  introContent?: SerializedEditorState
}

export const RelatedPosts = (props: RelatedPostsProps) => {
  const { className, docs, introContent } = props

  return (
    <div className={clsx('lg:container', className)}>
      {introContent && <RichText data={introContent} enableGutter={false} />}

      {docs?.map((doc, index) => {
        return <Card key={index} doc={doc} relationTo="posts" className="max-w-sm flex-1" />
      })}
    </div>
  )
}
