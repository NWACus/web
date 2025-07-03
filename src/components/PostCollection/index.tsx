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
      {posts && posts?.length > 0 ? (
        posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            return (
              <div className="mb-8" key={index}>
                <PostPreviewHorizontal className="h-full" doc={result} relationTo="posts" />
              </div>
            )
          }

          return null
        })
      ) : (
        <h3>There are no posts matching these results.</h3>
      )}
    </>
  )
}
