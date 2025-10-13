import { PostPreview, PostPreviewData } from '@/components/PostPreview'

export type Props = {
  posts: PostPreviewData[] | null | undefined
}

export const PostCollection = (props: Props) => {
  const { posts } = props

  return (
    <div className="@container">
      {posts && posts?.length > 0 ? (
        posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            return (
              <div className="mb-8" key={index}>
                <PostPreview className="h-full" doc={result} />
              </div>
            )
          }

          return null
        })
      ) : (
        <h3>There are no posts matching these results.</h3>
      )}
    </div>
  )
}
