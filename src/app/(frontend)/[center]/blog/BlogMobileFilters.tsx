'use client'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { FiltersPostsTag, PostsFilters } from './PostsFilters'

type Props = {
  tags: FiltersPostsTag[]
  sort: string
  hasActiveFilters: boolean
}

export const BlogMobileFilters = ({ tags, sort, hasActiveFilters }: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="posts" docCount={total} hasActiveFilters={hasActiveFilters}>
      <PostsFilters sort={sort} tags={tags} />
    </MobileFiltersDrawer>
  )
}
