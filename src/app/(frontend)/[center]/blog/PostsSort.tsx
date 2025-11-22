'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utilities/ui'
import { parseAsString, useQueryState } from 'nuqs'

type Props = {
  initialSort: string
  className?: string
}

export const PostsSort = ({ initialSort: _initialSort, className }: Props) => {
  const [sortOption, setSortOption] = useQueryState(
    'sort',
    parseAsString.withDefault('-publishedAt'),
  )

  return (
    <div className={cn('flex flex-col gap-2 pt-3', className)}>
      <h3 className="font-semibold">Sort</h3>
      <Select value={sortOption} onValueChange={setSortOption}>
        <SelectTrigger className="mb-4">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="-publishedAt">Newest to Oldest</SelectItem>
          <SelectItem value="publishedAt">Oldest to Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
