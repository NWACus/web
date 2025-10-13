'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  initialSort: string
}

export const EventsSort = ({ initialSort }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(initialSort === 'startDate')

  const [sortOption, setSortOption] = useState(initialSort)

  useEffect(() => {
    setSortOption(initialSort)
  }, [initialSort])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortOption)
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams, sortOption])

  return (
    <div>
      <h4 className="w-full">Sort</h4>
      <hr className="p-2" />
      <Select value={sortOption} onValueChange={setSortOption}>
        <SelectTrigger className="mb-4">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="startDate">Earliest First</SelectItem>
          <SelectItem value="-startDate">Latest First</SelectItem>
          <SelectItem value="registrationDeadline">Registration Deadline (Earliest)</SelectItem>
          <SelectItem value="-registrationDeadline">Registration Deadline (Latest)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
