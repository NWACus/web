'use client'

import { stateOptions } from '@/blocks/Form/State/options'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Provider } from '@/payload-types'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProviderCard } from './ProviderCard'

const COURSE_TYPES = [
  { value: 'rec-1', label: 'Rec 1' },
  { value: 'rec-2', label: 'Rec 2' },
  { value: 'pro-1', label: 'Pro 1' },
  { value: 'pro-2', label: 'Pro 2' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'awareness-external', label: 'Awareness' },
]

interface ProvidersSearchProps {
  initialProviders: Provider[]
}

export function ProvidersSearch({ initialProviders }: ProvidersSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState<string>('all')
  const [selectedCourseType, setSelectedCourseType] = useState<string>('all')

  // Initialize Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(initialProviders, {
        keys: ['name', 'location.city', 'location.state', 'details'],
        threshold: 0.3, // Fuzzy matching threshold (0 = exact, 1 = match anything)
        includeScore: true,
      }),
    [initialProviders],
  )

  // Filter providers
  const filteredProviders = useMemo(() => {
    let results = initialProviders

    // Apply fuzzy search
    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery)
      results = fuseResults.map((result) => result.item)
    }

    // Apply state filter
    if (selectedState !== 'all') {
      results = results.filter((p) => p.location?.state === selectedState)
    }

    // Apply course type filter
    if (selectedCourseType !== 'all') {
      results = results.filter(
        (p) => p.courseTypes && p.courseTypes.includes(selectedCourseType as any),
      )
    }

    return results
  }, [searchQuery, selectedState, selectedCourseType, initialProviders, fuse])

  // Group providers by state
  const providersByState = useMemo(() => {
    const grouped = new Map<string, Provider[]>()

    filteredProviders.forEach((provider) => {
      const state = provider.location?.state || 'Other'
      if (!grouped.has(state)) {
        grouped.set(state, [])
      }
      grouped.get(state)?.push(provider)
    })

    // Sort states alphabetically
    const sortedStates = Array.from(grouped.keys()).sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.localeCompare(b)
    })

    return sortedStates.map((state) => ({
      state,
      stateName: stateOptions.find((s) => s.value === state)?.label || state,
      providers: (grouped.get(state) || []).sort((a, b) => a.name.localeCompare(b.name)),
    }))
  }, [filteredProviders])

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* State Filter */}
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {stateOptions.map((state) => (
              <SelectItem key={state.value} value={state.value}>
                {state.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Course Type Filter */}
        <Select value={selectedCourseType} onValueChange={setSelectedCourseType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All course types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All course types</SelectItem>
            {COURSE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredProviders.length === 0 ? (
          'No providers found'
        ) : (
          <>
            {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'}{' '}
            found
          </>
        )}
      </div>

      {/* Providers grouped by state */}
      {providersByState.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No providers match your search criteria.</p>
          <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {providersByState.map(({ state, stateName, providers }) => (
            <div key={state} className="space-y-4">
              {/* State Header */}
              <div className="border-b pb-2">
                <h2 className="text-2xl font-bold">
                  {stateName} ({providers.length})
                </h2>
              </div>

              {/* Provider Cards */}
              <div className="space-y-4">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
