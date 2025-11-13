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
    <div className={cn(className)}>
      <h4 className="w-full">Sort</h4>
      <hr className="p-2" />
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
