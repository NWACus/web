'use client'
import { Tag } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Props = {
  tags: Tag[]
}

export const PostsTags = ({ tags }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasUserInteracted = useRef(false)

  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagParam = searchParams.get('tag')
    return tagParam ? tagParam.split(',').filter(Boolean) : []
  })

  const toggleTag = (slug: string) => {
    hasUserInteracted.current = true
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  useEffect(() => {
    if (!hasUserInteracted.current) return

    const params = new URLSearchParams(searchParams.toString())
    if (selectedTags.length > 0) {
      params.set('tag', selectedTags.join(','))
    } else {
      params.delete('tag')
    }
    router.push(`/posts?${params.toString()}`)
  }, [router, searchParams, selectedTags])

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
