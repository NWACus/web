'use client'
import { Checkbox } from '@/components/ui/checkbox'
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
    const tagParam = searchParams.get('tags')
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
      params.set('tags', selectedTags.join(','))
    } else {
      params.delete('tags')
    }
    router.push(`/posts?${params.toString()}`)
  }, [router, searchParams, selectedTags])

  return (
    <div className="mb-4">
      <h4 className="w-full">Filter by tag</h4>
      <hr className="p-2" />
      <ul className="flex flex-wrap gap-3 p-0 list-none">
        {tags.map((tag) => {
          const isChecked = selectedTags.includes(tag.slug)
          return (
            <li key={tag.slug}>
              <div
                className={cn(
                  'p-2 rounded-md cursor-pointer flex align-center border border-brand-200 text-primary bg-white',
                  { 'bg-brand-200': isChecked },
                )}
                onClick={() => toggleTag(tag.slug)}
                aria-pressed={isChecked}
              >
                <Checkbox className="mt-1 mr-1" checked={isChecked} />
                {tag.title}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
