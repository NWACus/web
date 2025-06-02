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
        {/* Grid classes */}
        {/* <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8"> */}
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
