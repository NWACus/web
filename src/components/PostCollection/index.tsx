import {
  PostPreviewHorizontal,
  PostPreviewHorizontalData,
} from '@/components/PostPreviewHorizontal'

export type Props = {
  posts: PostPreviewHorizontalData[] | null | undefined
}

export const PostCollection = (props: Props) => {
  const { posts } = props

  return (
    <>
      {posts?.map((result, index) => {
        if (typeof result === 'object' && result !== null) {
          return (
            <div className="py-6" key={index}>
              <PostPreviewHorizontal className="h-full" doc={result} relationTo="posts" />
            </div>
          )
        }

        return null
      })}
    </>
  )
}
