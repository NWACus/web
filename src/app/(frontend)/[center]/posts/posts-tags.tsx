'use client'
import { Tag } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  tags: Tag[]
}

export const PostsTags = ({ tags }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedTags.length > 0) {
      params.set('tag', selectedTags.join(','))
    } else {
      params.delete('tag')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams, selectedTags])

  return (
    <div className="mb-4">
      <h4 className="w-full">Filter by tag</h4>
      <hr className="p-2" />
      <ul className="flex flex-wrap gap-3 p-0 list-none">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <button
              className={cn('p-2 rounded cursor-pointer', {
                'bg-callout': selectedTags.includes(tag.slug),
                'bg-secondary': !selectedTags.includes(tag.slug),
              })}
              type="button"
              onClick={() => toggleTag(tag.slug)}
              aria-pressed={selectedTags.includes(tag.slug)}
            >
              {tag.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
