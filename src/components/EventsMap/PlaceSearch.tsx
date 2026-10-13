'use client'

import { Input } from '@/components/ui/input'
import type { LatLng } from '@/utilities/geo/distance'
import { cn } from '@/utilities/ui'
import { useEffect, useId, useState, type RefObject } from 'react'
import { retrievePlace, suggestPlaces, type PlaceSuggestion } from './mapboxPlaces'

export type PickedPlace = { label: string; point: LatLng }

const SUGGEST_DELAY_MS = 250

function usePlaceSuggestions(query: string, sessionToken: string) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      suggestPlaces(trimmed, sessionToken, controller.signal)
        .then((next) => {
          setSuggestions(next)
          setFailed(false)
        })
        .catch(() => setFailed(!controller.signal.aborted))
    }, SUGGEST_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, sessionToken])

  return { suggestions, failed }
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
  onPick,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onPick: (place: PickedPlace) => void
}) {
  const listId = useId()
  // One Mapbox billing session per time the sort menu opens.
  const [sessionToken] = useState(() => crypto.randomUUID())
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(-1)
  const [lookupFailed, setLookupFailed] = useState(false)
  const { suggestions, failed } = usePlaceSuggestions(query, sessionToken)

  const pick = (suggestion: PlaceSuggestion) =>
    retrievePlace(suggestion.id, sessionToken)
      .then((point) => onPick({ label: suggestion.name, point }))
      .catch(() => setLookupFailed(true))

  const keyActions: Record<string, () => void> = {
    ArrowDown: () => setActive((index) => Math.min(index + 1, suggestions.length - 1)),
    ArrowUp: () => setActive((index) => Math.max(index - 1, -1)),
    Enter: () => {
      const suggestion = suggestions[active] ?? suggestions[0]
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
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Town, trailhead or ZIP"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(-1)
          setLookupFailed(false)
        }}
        onKeyDown={(event) => {
          const action = keyActions[event.key]
          if (!action) return
          event.preventDefault()
          action()
        }}
      />
      <SuggestionList id={listId} suggestions={suggestions} active={active} onPick={pick} />
      {(failed || lookupFailed) && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          Place search isn’t working right now. Try again, or use your location.
        </p>
      )}
    </div>
  )
}
