'use client'

/**
 * A loader for a JSON admin endpoint, fetched once per URL and shared across the form's fields.
 * A failure is forgotten so the next call retries.
 */
export function createFetchOnce<T>(): (url: string) => Promise<T> {
  const cache = new Map<string, Promise<T>>()
  return (url) => {
    const cached = cache.get(url)
    if (cached) return cached
    const pending = fetch(url, { credentials: 'include' })
      .then(async (response): Promise<T> => {
        const body = await response.json()
        if (!response.ok)
          throw new Error(body.error ?? `SnowObs lookup failed (${response.status})`)
        return body
      })
      .catch((error: unknown) => {
        cache.delete(url)
        throw error
      })
    cache.set(url, pending)
    return pending
  }
}
