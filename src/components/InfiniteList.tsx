'use client'

import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Card } from './ui/card'

type ListItem = { id: number | string }

/** The shape every list endpoint returns, apart from its items key. */
type ListResult = { hasMore: boolean; total: number; error?: string }

interface InfiniteListOptions<T extends ListItem, R extends ListResult> {
  initialItems: T[]
  initialHasMore: boolean
  initialError?: string
  /** List API route, e.g. `/api/nwac/events`. */
  endpoint: string
  /** Page URL params passed through to the endpoint as filters. */
  filterKeys: readonly string[]
  /** Values for filters missing from the page URL. */
  filterDefaults?: Record<string, string>
  /** Pulls the page's items out of the endpoint's result. Keep it stable: it's an effect dependency. */
  itemsOf: (result: R) => T[]
  /** Plural noun for the list's messages, e.g. "events". */
  noun: string
}

interface InfiniteListProps<T extends ListItem, R extends ListResult>
  extends InfiniteListOptions<T, R> {
  renderItem: (item: T) => ReactNode
  className?: string
}

const fetchPage = <R,>(endpoint: string, filterQuery: string, offset: number): Promise<R> => {
  const query = new URLSearchParams(filterQuery)
  query.set('offset', String(offset))
  return fetch(`${endpoint}?${query}`).then((res) => res.json())
}

/** Items already shown are skipped so an overlapping page can't render duplicate keys. */
const appendNew = <T extends ListItem>(shown: T[], page: T[]): T[] => {
  const shownIds = new Set(shown.map((item) => item.id))
  return [...shown, ...page.filter((item) => !shownIds.has(item.id))]
}

const useFilterQuery = (filterKeys: readonly string[], filterDefaults: Record<string, string>) => {
  const searchParams = useSearchParams()
  const query = new URLSearchParams()
  for (const key of filterKeys) {
    const value = searchParams.get(key) || filterDefaults[key]
    if (value) query.set(key, value)
  }
  return query.toString()
}

const useInfiniteList = <T extends ListItem, R extends ListResult>({
  initialItems,
  initialHasMore,
  initialError,
  endpoint,
  filterKeys,
  filterDefaults = {},
  itemsOf,
  noun,
}: InfiniteListOptions<T, R>) => {
  const [items, setItems] = useState<T[]>(initialItems)
  const [offset, setOffset] = useState(initialItems.length)
  const [hasMoreData, setHasMoreData] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const filterQuery = useFilterQuery(filterKeys, filterDefaults)
  const previousFilterQueryRef = useRef(filterQuery)
  const { setTotal } = useFiltersTotalContext()
  const { ref, inView } = useInView({ threshold: 0, triggerOnce: false })

  // Start over from the first page when the filters change
  useEffect(() => {
    if (filterQuery === previousFilterQueryRef.current) return
    previousFilterQueryRef.current = filterQuery

    const resetAndFetch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchPage<R>(endpoint, filterQuery, 0)
        if (result.error) {
          setError(result.error)
          setItems([])
          setHasMoreData(false)
          setTotal(0)
          return
        }
        const page = itemsOf(result)
        setItems(page)
        setOffset(page.length)
        setHasMoreData(result.hasMore)
        setTotal(result.total)
      } catch (_error) {
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    resetAndFetch()
  }, [endpoint, filterQuery, itemsOf, setTotal])

  useEffect(() => {
    if (!inView || !hasMoreData || isLoading) return

    const loadMore = async () => {
      setIsLoading(true)
      try {
        const result = await fetchPage<R>(endpoint, filterQuery, offset)
        if (result.error) {
          setError(result.error)
          setHasMoreData(false)
          return
        }
        const page = itemsOf(result)
        setItems((shown) => appendNew(shown, page))
        setOffset((prevOffset) => prevOffset + page.length)
        setHasMoreData(result.hasMore)
      } catch (_error) {
        setError(`An unexpected error occurred while loading more ${noun}.`)
        setHasMoreData(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadMore()
  }, [inView, hasMoreData, isLoading, offset, endpoint, filterQuery, itemsOf, noun])

  return { items, hasMoreData, isLoading, error, ref }
}

const ListError = ({ noun, error }: { noun: string; error: string }) => (
  <Card className="p-6">
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h3 className="font-semibold text-lg capitalize">Error loading {noun}</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  </Card>
)

/** A filtered list that fetches the next page from its API route as the reader scrolls. */
export const InfiniteList = <T extends ListItem, R extends ListResult>({
  renderItem,
  className,
  ...options
}: InfiniteListProps<T, R>) => {
  const { items, hasMoreData, isLoading, error, ref } = useInfiniteList(options)

  if (error) {
    return <ListError noun={options.noun} error={error} />
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No {options.noun} found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {items.map(renderItem)}

      {hasMoreData && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
