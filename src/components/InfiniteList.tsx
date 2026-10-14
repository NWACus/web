'use client'

import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Dispatch, ReactNode, RefObject, SetStateAction, useEffect, useRef, useState } from 'react'
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
  /** Plural label for the list's messages, e.g. "events". */
  itemsLabel: string
}

interface InfiniteListProps<T extends ListItem, R extends ListResult>
  extends InfiniteListOptions<T, R> {
  renderItem: (item: T) => ReactNode
  className?: string
}

const fetchPage = <R,>(
  endpoint: string,
  filterQuery: string,
  offset: number,
  signal: AbortSignal,
): Promise<R> => {
  const query = new URLSearchParams(filterQuery)
  query.set('offset', String(offset))
  return fetch(`${endpoint}?${query}`, { signal }).then((res) => res.json())
}

type RequestRef = RefObject<AbortController | null>

/** Aborts the request in flight, so a page fetched for old filters can't land on the new list. */
const startRequest = (requestRef: RequestRef, setIsLoading: Dispatch<SetStateAction<boolean>>) => {
  requestRef.current?.abort()
  const request = new AbortController()
  requestRef.current = request
  setIsLoading(true)
  return request
}

const endRequest = (
  requestRef: RequestRef,
  request: AbortController,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
) => {
  if (requestRef.current !== request) return
  requestRef.current = null
  setIsLoading(false)
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
  itemsLabel,
}: InfiniteListOptions<T, R>) => {
  const [items, setItems] = useState<T[]>(initialItems)
  const [offset, setOffset] = useState(initialItems.length)
  const [hasMoreData, setHasMoreData] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const filterQuery = useFilterQuery(filterKeys, filterDefaults)
  const previousFilterQueryRef = useRef(filterQuery)
  const requestRef = useRef<AbortController | null>(null)
  const { setTotal } = useFiltersTotalContext()
  const { ref, inView } = useInView({ threshold: 0, triggerOnce: false })

  useEffect(
    () => () => {
      requestRef.current?.abort()
      requestRef.current = null
    },
    [],
  )

  // Start over from the first page when the filters change
  useEffect(() => {
    if (filterQuery === previousFilterQueryRef.current) return
    previousFilterQueryRef.current = filterQuery

    const resetAndFetch = async () => {
      const request = startRequest(requestRef, setIsLoading)
      setError(null)
      try {
        const result = await fetchPage<R>(endpoint, filterQuery, 0, request.signal)
        if (request.signal.aborted) return
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
        if (request.signal.aborted) return
        setError('An unexpected error occurred. Please try again.')
      } finally {
        endRequest(requestRef, request, setIsLoading)
      }
    }

    resetAndFetch()
  }, [endpoint, filterQuery, itemsOf, setTotal])

  useEffect(() => {
    // The ref catches a reset started earlier in this same commit, before isLoading re-renders
    if (!inView || !hasMoreData || isLoading || requestRef.current) return

    const loadMore = async () => {
      const request = startRequest(requestRef, setIsLoading)
      try {
        const result = await fetchPage<R>(endpoint, filterQuery, offset, request.signal)
        if (request.signal.aborted) return
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
        if (request.signal.aborted) return
        setError(`An unexpected error occurred while loading more ${itemsLabel}.`)
        setHasMoreData(false)
      } finally {
        endRequest(requestRef, request, setIsLoading)
      }
    }

    loadMore()
  }, [inView, hasMoreData, isLoading, offset, endpoint, filterQuery, itemsOf, itemsLabel])

  return { items, hasMoreData, isLoading, error, ref }
}

const ListError = ({ itemsLabel, error }: { itemsLabel: string; error: string }) => (
  <Card className="p-6">
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h3 className="font-semibold text-lg capitalize">Error loading {itemsLabel}</h3>
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
    return <ListError itemsLabel={options.itemsLabel} error={error} />
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No {options.itemsLabel} found matching your criteria.
        </p>
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
