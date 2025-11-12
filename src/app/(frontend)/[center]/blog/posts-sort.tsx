'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseAsString, useQueryState } from 'nuqs'

type Props = {
  initialSort: string
}

export const PostsSort = ({ initialSort: _initialSort }: Props) => {
  const [sortOption, setSortOption] = useQueryState(
    'sort',
    parseAsString.withDefault('-publishedAt'),
  )

  return (
    <div>
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
