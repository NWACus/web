import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { PostsSort } from './PostsSort'

export type FiltersPostsTag = { id: number; title: string; slug: string }

export const PostsFilters = ({ sort, tags }: { sort: string; tags: FiltersPostsTag[] }) => {
  const tagOptions = tags.map((tag) => ({
    label: tag.title,
    value: tag.slug,
  }))

  return (
    <>
      <PostsSort initialSort={sort} className="border-b" />
      <CheckboxFilter
        title="Filter by tag"
        urlParam="tags"
        options={tagOptions}
        defaultOpen={true}
        showBottomBorder={false}
        enableSearch={tags.length > 10}
        searchPlaceholder="Search tags..."
      />
    </>
  )
}
