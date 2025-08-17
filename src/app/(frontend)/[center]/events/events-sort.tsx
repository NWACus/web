'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  initialSort: string
}

export const EventsSort = ({ initialSort }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState(initialSort)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (sort !== 'startDate') {
      params.set('sort', sort)
    } else {
      params.delete('sort')
    }
    router.push(`/events?${params.toString()}`)
  }, [router, searchParams, sort])

  return (
    <div className="mb-4">
      <h4 className="w-full mb-2">Sort by</h4>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="startDate">Date (Earliest First)</SelectItem>
          <SelectItem value="-startDate">Date (Latest First)</SelectItem>
          <SelectItem value="title">Title (A-Z)</SelectItem>
          <SelectItem value="-title">Title (Z-A)</SelectItem>
          <SelectItem value="cost">Cost (Low to High)</SelectItem>
          <SelectItem value="-cost">Cost (High to Low)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
