'use client'

import { useEffect, useState } from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostPreviewHorizontalData } from '@/components/PostPreviewHorizontal'
import { Post, Tag } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { PaginatedDocs } from 'payload'

type Props = {
  tags: Tag[]
  center: string
}

export const PostsGrid = (props: Props) => {
  const { center, tags } = props

  const [postsData, setPostsData] = useState<PaginatedDocs<Post>>()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PostPreviewHorizontalData[] | null>()
  const [error, setError] = useState<{ message: string; status?: string } | null>(null)
  // TODO add loading state
  // const [loading, setLoading] = useState(false)

  const fetchPosts = async (center: string, selectedTags: string[]) => {
    let url = `/api/posts?depth=1&where[tenant.slug][equals]=${center}`
    if (selectedTags.length > 0) {
      const tagQuery = selectedTags.map(encodeURIComponent).join(',')
      url += `&where[tags.slug][in]=${tagQuery}`
    }
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`)
      }

      const data = await res.json()
      setPostsData(data)
      setFilteredPosts(data.docs)
    } catch (err) {
      setError({
        message: `Post tags not working correctly: ${err}`,
      })
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tagsFromUrl = params.getAll('tag')
    if (tagsFromUrl.length) {
      setSelectedTags(tagsFromUrl)
    }
  }, [])

  // Update URL search params when selectedTags change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.delete('tag')
    selectedTags.forEach((tag) => params.append('tag', tag))
    const paramsString = params.toString()
    const newUrl = paramsString
      ? `${window.location.pathname}?${paramsString}`
      : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [selectedTags])

  useEffect(() => {
    fetchPosts(center, selectedTags)
  }, [center, selectedTags])

  return (
    <div>
      <div className="container mb-8">
        <PageRange
          collectionLabels={{
            plural: 'Posts',
            singular: 'Post',
          }}
          currentPage={postsData?.page}
          limit={12}
          totalDocs={postsData?.totalDocs}
        />
      </div>

      <div className="container mb-16 flex flex-col md:flex-row md:flex-row-reverse flex-1 gap-6">
        <div>
          {error && <div>{`${error.message || ''}`}</div>}
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '10px' }}>
              {tags.map((tag) => (
                <li key={tag.slug}>
                  <button
                    className={cn('p-3 rounded cursor-pointer', {
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
          </nav>
          {/* Add sort */}
        </div>
        <CollectionArchive posts={filteredPosts} />
      </div>

      <div className="container">
        {postsData?.totalPages && postsData?.totalPages > 1 && postsData?.page && (
          <Pagination page={postsData?.page} totalPages={postsData?.totalPages} />
        )}
      </div>
    </div>
  )
}
