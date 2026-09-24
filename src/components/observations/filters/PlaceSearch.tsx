'use client'

/**
 * "Search for a location…": moves the map to a place and marks it, which — because the list
 * follows the map — lists what was observed near it. Not a filter and not in the URL, as in the
 * widget; the count line says "near {place}" until the reader pans or zooms back out.
 */
import { Loader2, MapPinned, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { Input } from '@/components/ui/input'

import {
  retrievePlace,
  suggestPlaces,
  type ChosenPlace,
  type PlaceSuggestion,
} from '../map/placeSearch'

/** The widget searches once a query passes three characters, half a second after typing stops. */
const MIN_QUERY = 4
const DEBOUNCE_MS = 500

interface PlaceSearchProps {
  token: string
  chosen: ChosenPlace | null
  proximity: () => [number, number] | null
  onChoose: (place: ChosenPlace) => void
  onClear: () => void
}

function useSuggestions(
  query: string,
  token: string,
  session: string,
  proximity: PlaceSearchProps['proximity'],
) {
  const [results, setResults] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (query.trim().length < MIN_QUERY) {
      setResults([])
      return
    }
    let current = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      suggestPlaces(query, proximity(), token, session)
        .then((found) => current && setResults(found))
        .catch(() => current && setResults([]))
        .finally(() => current && setLoading(false))
    }, DEBOUNCE_MS)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
    // `proximity` is read at search time, not a reason to search again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, token, session])
  return { results, loading, clear: () => setResults([]) }
}

/** A spinner while searching, else a button to clear the search when there is one. */
function InputAction({
  loading,
  clearable,
  onClear,
}: {
  loading: boolean
  clearable: boolean
  onClear: () => void
}) {
  if (loading) {
    return (
      <Loader2
        className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin"
        aria-label="Searching"
      />
    )
  }
  if (!clearable) return null
  return (
    <button
      type="button"
      onClick={onClear}
      className="absolute right-2 top-1/2 -translate-y-1/2"
      aria-label="Clear location search"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function Suggestions({
  id,
  results,
  onChoose,
}: {
  id: string
  results: PlaceSuggestion[]
  onChoose: (suggestion: PlaceSuggestion) => void
}) {
  if (results.length === 0) return null
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md"
    >
      {results.map((result) => (
        <li key={result.id} role="option" aria-selected={false}>
          <button
            type="button"
            onClick={() => onChoose(result)}
            className="w-full px-3 py-2 text-left hover:bg-muted"
          >
            <div className="text-sm font-medium">{result.name}</div>
            <div className="text-xs text-muted-foreground">{result.context}</div>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function PlaceSearch({ token, chosen, proximity, onChoose, onClear }: PlaceSearchProps) {
  const [query, setQuery] = useState('')
  const [session] = useState(() => crypto.randomUUID())
  const { results, loading, clear } = useSuggestions(query, token, session, proximity)
  const listId = useId()

  const choose = async (suggestion: PlaceSuggestion) => {
    const place = await retrievePlace(suggestion, token, session).catch(() => null)
    if (!place) return
    setQuery('')
    clear()
    onChoose(place)
  }

  const reset = () => {
    setQuery('')
    clear()
    onClear()
  }

  return (
    <div className="relative w-full lg:w-64">
      <MapPinned
        className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label="Search for a location"
        placeholder="Search for a location..."
        className="h-9 pl-8 pr-8"
        value={chosen?.label ?? query}
        readOnly={chosen !== null}
        onChange={(event) => setQuery(event.target.value)}
        aria-controls={listId}
        aria-expanded={results.length > 0}
        role="combobox"
        aria-autocomplete="list"
      />
      <InputAction loading={loading} clearable={Boolean(chosen || query)} onClear={reset} />
      <Suggestions id={listId} results={results} onChoose={choose} />
    </div>
  )
}
