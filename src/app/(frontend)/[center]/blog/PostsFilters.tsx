import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { PostsSort } from './PostsSort'

export type FiltersPostsTag = { label: string; value: string }

export const PostsFilters = ({ sort, tags }: { sort: string; tags: FiltersPostsTag[] }) => {
  return (
    <>
      <PostsSort initialSort={sort} className="border-b" />
      <CheckboxFilter
        title="Filter by tag"
        urlParam="tags"
        options={tags}
        defaultOpen={true}
        showBottomBorder={false}
        enableSearch={tags.length > 10}
        searchPlaceholder="Search tags..."
      />
    </>
  )
}
