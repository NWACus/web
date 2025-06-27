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

  const [selectedTag, setSelectedTag] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedTag) {
      params.set('tag', selectedTag)
    } else {
      params.delete('tag')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams, selectedTag])

  return (
    <div>
      <h4 className="w-full">Filter by tag</h4>
      <hr className="p-2" />
      <ul className="flex gap-4 p-0 list-none">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <button
              className={cn('p-3 rounded cursor-pointer', {
                'bg-callout': selectedTag === tag.slug,
                'bg-secondary': selectedTag !== tag.slug,
              })}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag.slug ? '' : tag.slug)}
              aria-pressed={selectedTag === tag.slug}
            >
              {tag.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
