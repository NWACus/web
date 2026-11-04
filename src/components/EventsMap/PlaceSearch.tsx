'use client'

import { Input } from '@/components/ui/input'
import type { LatLng } from '@/utilities/geo/distance'
import { cn } from '@/utilities/ui'
import { useEffect, useId, useState, type RefObject } from 'react'
import { retrievePlace, suggestPlaces, type PlaceSuggestion } from './mapboxPlaces'

export type PickedPlace = { label: string; point: LatLng }

const SUGGEST_DELAY_MS = 250

/** Suggestions, and the text they were found for. */
type Suggestions = { query: string; list: PlaceSuggestion[] }

const NO_SUGGESTIONS: Suggestions = { query: '', list: [] }

function usePlaceSuggestions(query: string, sessionToken: string) {
  const [results, setResults] = useState<Suggestions>(NO_SUGGESTIONS)
  const [failed, setFailed] = useState(false)
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults({ query: trimmed, list: [] })
      setFailed(false)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      suggestPlaces(trimmed, sessionToken, controller.signal)
        .then((list) => {
          setResults({ query: trimmed, list })
          setFailed(false)
        })
        .catch(() => setFailed(!controller.signal.aborted))
    }, SUGGEST_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, sessionToken])

  // The last list stays up while the next one loads, but it's only `current` once it matches the
  // text, so Enter can't pick a place found for what the reader typed before.
  return { suggestions: results.list, current: results.query === trimmed, failed }
}

/** The highlighted suggestion, back to none whenever the list changes so it never points past it. */
function useActiveSuggestion(suggestions: PlaceSuggestion[]) {
  const [state, setState] = useState({ suggestions, index: -1 })
  const index = state.suggestions === suggestions ? state.index : -1
  const moveTo = (next: number) =>
    setState({ suggestions, index: Math.max(-1, Math.min(next, suggestions.length - 1)) })
  return {
    index,
    next: () => moveTo(index + 1),
    previous: () => moveTo(index - 1),
    reset: () => moveTo(-1),
  }
}

/** The box's text. A prefilled place isn't a search, so it opens no suggestions or billed session. */
function usePlaceQuery(currentPlace: string) {
  const [query, setQuery] = useState(currentPlace)
  const [typed, setTyped] = useState(false)
  return {
    query,
    searchText: typed ? query : '',
    change: (value: string) => {
      setQuery(value)
      setTyped(true)
    },
    // Selected, so typing replaces the prefilled place.
    selectPrefilled: (input: HTMLInputElement) => {
      if (!typed) input.select()
    },
  }
}

function SuggestionList({
  id,
  suggestions,
  active,
  onPick,
}: {
  id: string
  suggestions: PlaceSuggestion[]
  active: number
  onPick: (suggestion: PlaceSuggestion) => void
}) {
  if (suggestions.length === 0) return null
  return (
    <ul id={id} role="listbox" className="mt-1 rounded-md border bg-popover py-1">
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.id}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === active}
          // Keeps focus in the input, so a click doesn't blur it before the pick lands.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(suggestion)}
          className={cn('cursor-pointer px-3 py-1.5 text-sm', index === active && 'bg-accent')}
        >
          <div className="font-medium">{suggestion.name}</div>
          {suggestion.context && (
            <div className="text-xs text-muted-foreground">{suggestion.context}</div>
          )}
        </li>
      ))}
    </ul>
  )
}

/** A town, trailhead or ZIP box with Mapbox suggestions, for sorting events by distance. */
export function PlaceSearch({
  inputRef,
  currentPlace,
  onPick,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  /** The place events are sorted from now, shown in the box until the reader types. */
  currentPlace: string
  onPick: (place: PickedPlace) => void
}) {
  const listId = useId()
  // One Mapbox billing session per time the sort menu opens.
  const [sessionToken] = useState(() => crypto.randomUUID())
  const placeQuery = usePlaceQuery(currentPlace)
  const [lookupFailed, setLookupFailed] = useState(false)
  const { suggestions, current, failed } = usePlaceSuggestions(placeQuery.searchText, sessionToken)
  const active = useActiveSuggestion(suggestions)

  const pick = (suggestion: PlaceSuggestion) =>
    retrievePlace(suggestion.id, sessionToken)
      .then((point) => onPick({ label: suggestion.name, point }))
      .catch(() => setLookupFailed(true))

  const keyActions: Record<string, () => void> = {
    ArrowDown: active.next,
    ArrowUp: active.previous,
    Enter: () => {
      const suggestion = current && (suggestions[active.index] ?? suggestions[0])
      if (suggestion) pick(suggestion)
    },
  }

  return (
    <div>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Town, trailhead or ZIP
      </label>
      <Input
        id={`${listId}-input`}
        ref={inputRef}
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active.index >= 0 ? `${listId}-${active.index}` : undefined}
        autoComplete="off"
        placeholder="Town, trailhead or ZIP"
        // iOS Safari zooms the page into any input under 16px.
        className="text-base md:text-sm"
        value={placeQuery.query}
        onFocus={(event) => placeQuery.selectPrefilled(event.target)}
        onChange={(event) => {
          placeQuery.change(event.target.value)
          active.reset()
          setLookupFailed(false)
        }}
        onKeyDown={(event) => {
          const action = keyActions[event.key]
          if (!action) return
          event.preventDefault()
          action()
        }}
      />
      <SuggestionList id={listId} suggestions={suggestions} active={active.index} onPick={pick} />
      {(failed || lookupFailed) && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          Place search isn’t working right now. Try again, or use your location.
        </p>
      )}
    </div>
  )
}
