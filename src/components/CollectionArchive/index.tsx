import { cn } from '@/utilities/ui'

import {
  PostPreviewHorizontal,
  PostPreviewHorizontalData,
} from '@/components/PostPreviewHorizontal'

export type Props = {
  posts: PostPreviewHorizontalData[]
}

export const CollectionArchive = (props: Props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div>
        <div>
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              return (
                <div className="col-span-4" key={index}>
                  <PostPreviewHorizontal className="h-full" doc={result} relationTo="posts" />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
