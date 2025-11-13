'use client'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import type { Tag } from '@/payload-types'
import { BlogTagsFilter } from './blog-tags-filter'
import { PostsSort } from './posts-sort'

type Props = {
  tags: Tag[]
  initialSort: string
  hasActiveFilters: boolean
}

export const BlogMobileFilters = ({ tags, initialSort, hasActiveFilters }: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="posts" docCount={total} hasActiveFilters={hasActiveFilters}>
      <PostsSort initialSort={initialSort} className="pt-3 border-b" />
      {tags.length > 1 && <BlogTagsFilter tags={tags} />}
    </MobileFiltersDrawer>
  )
}
