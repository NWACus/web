'use client'

import { useAuth } from '@payloadcms/ui'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { Post } from '@/payload-types'

type RecentPost = Pick<Post, 'id' | 'title' | 'updatedAt' | 'slug'>

export const RecentPostsWidget = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<RecentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await fetch('/api/posts?limit=6&sort=-updatedAt&depth=0')
        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }
        const data = await response.json()
        setPosts(data.docs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentPosts()
  }, [])

  if (!user) {
    return null
  }

  return (
    <div className="recent-posts-widget card">
      <div className="recent-posts-widget__header">
        <h3 className="card__title">Recent Posts</h3>
        <Link href="/admin/collections/posts" className="recent-posts-widget__view-all">
          View all
        </Link>
      </div>

      <div className="recent-posts-widget__content">
        {loading && <p className="recent-posts-widget__message">Loading...</p>}

        {error && (
          <p className="recent-posts-widget__message recent-posts-widget__message--error">
            {error}
          </p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="recent-posts-widget__message">No posts found</p>
        )}

        {!loading && !error && posts.length > 0 && (
          <ul className="recent-posts-widget__list">
            {posts.map((post) => (
              <li key={post.id} className="recent-posts-widget__item">
                <Link
                  href={`/admin/collections/posts/${post.id}`}
                  className="recent-posts-widget__item-link"
                >
                  <span className="recent-posts-widget__item-title">{post.title}</span>
                  <span className="recent-posts-widget__item-date">
                    {format(new Date(post.updatedAt), 'MMM d, yyyy')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .recent-posts-widget {
          flex-direction: column;
          align-items: stretch;
        }

        .recent-posts-widget__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .recent-posts-widget__view-all {
          font-size: 0.8125rem;
          color: var(--theme-elevation-500);
          text-decoration: none;
          flex-shrink: 0;
        }

        .recent-posts-widget__view-all:hover {
          color: var(--theme-text);
        }

        .recent-posts-widget__content {
          width: 100%;
          margin-top: 12px;
        }

        .recent-posts-widget__message {
          color: var(--theme-elevation-500);
          font-size: 0.875rem;
          margin: 0;
        }

        .recent-posts-widget__message--error {
          color: var(--theme-error-500);
        }

        .recent-posts-widget__list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .recent-posts-widget__item {
          border-bottom: 1px solid var(--theme-elevation-100);
        }

        .recent-posts-widget__item:last-child {
          border-bottom: none;
        }

        .recent-posts-widget__item-link {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          text-decoration: none;
          color: var(--theme-text);
          gap: 16px;
          transition: color 100ms ease;
        }

        .recent-posts-widget__item-link:hover {
          color: var(--theme-elevation-600);
        }

        .recent-posts-widget__item-title {
          font-size: 0.875rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .recent-posts-widget__item-date {
          font-size: 0.75rem;
          color: var(--theme-elevation-500);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}

export default RecentPostsWidget
