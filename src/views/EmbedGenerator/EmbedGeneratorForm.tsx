'use client'

import {
  Button,
  CheckboxInput,
  DatePicker,
  FieldLabel,
  SelectInput,
  TextareaInput,
  TextInput,
  toast,
  usePayloadAPI,
} from '@payloadcms/ui'
import { Check, Copy } from 'lucide-react'
import type { OptionObject } from 'payload'
import { type ChangeEvent, useMemo, useState } from 'react'

import { courseTypesData } from '@/constants/courseTypes'
import { affinityGroupOptions } from '@/fields/affinityGroupField'
import { stateOptions } from '@/fields/location/states'
import { modeOfTravelOptions } from '@/fields/modeOfTravelField'
import type { Provider } from '@/payload-types'
import { format } from 'date-fns'

type EmbedType = 'providers' | 'courses'
type HeightMode = 'auto' | 'fixed'

function isEmbedType(value: unknown): value is EmbedType {
  return value === 'providers' || value === 'courses'
}

function isHeightMode(value: unknown): value is HeightMode {
  return value === 'auto' || value === 'fixed'
}

function extractStringValues(
  selected: { value?: unknown }[] | { value?: unknown } | null | undefined,
): string[] {
  if (!selected) return []
  if (Array.isArray(selected)) {
    return selected.map((s) => s.value).filter((v): v is string => typeof v === 'string')
  }
  if ('value' in selected && typeof selected.value === 'string') {
    return [selected.value]
  }
  return []
}

interface EmbedOptions {
  title: string
  heightMode: HeightMode
  fixedHeight: string
  showFilters: boolean
  types: string[]
  providers: string[]
  states: string[]
  affinityGroups: string[]
  modesOfTravel: string[]
  startDate: Date | undefined
  endDate: Date | undefined
}

const initialOptions: EmbedOptions = {
  title: '',
  heightMode: 'auto',
  fixedHeight: '800',
  showFilters: false,
  types: [],
  providers: [],
  states: [],
  affinityGroups: [],
  modesOfTravel: [],
  startDate: undefined,
  endDate: undefined,
}

function formatDateForParam(date: Date | undefined): string {
  if (!date) return ''
  return format(date, 'MM-dd-yyyy')
}

function generateEmbedCode(type: EmbedType, options: EmbedOptions, baseUrl: string): string {
  const params = new URLSearchParams()

  if (options.title) params.set('title', options.title)

  if (type === 'courses') {
    if (options.showFilters) params.set('showFilters', 'true')
    if (options.types.length) params.set('types', options.types.join(','))
    if (options.providers.length) params.set('providers', options.providers.join(','))
    if (options.states.length) params.set('states', options.states.join(','))
    if (options.affinityGroups.length)
      params.set('affinityGroups', options.affinityGroups.join(','))
    if (options.modesOfTravel.length) params.set('modesOfTravel', options.modesOfTravel.join(','))
    const startDateStr = formatDateForParam(options.startDate)
    const endDateStr = formatDateForParam(options.endDate)
    if (startDateStr) params.set('startDate', startDateStr)
    if (endDateStr) params.set('endDate', endDateStr)
  }

  const queryString = params.toString()
  const src = `${baseUrl}/embeds/${type}${queryString ? '?' + queryString : ''}`
  const iframeId = `avy-web-embed-${type}`

  // For auto height, use 0 as initial height (iframe-resizer will adjust)
  // For fixed height, use the user-specified value
  const height = options.heightMode === 'auto' ? '0' : `${options.fixedHeight}px`

  if (options.heightMode === 'auto') {
    return `<iframe
  id="${iframeId}"
  src="${src}"
  height="${height}"
  scrolling="no"
  width="100%"
  style="border: none;"
></iframe>
<script type="module">
  import { initialize } from "https://cdn.jsdelivr.net/npm/@open-iframe-resizer/core@v2.1.0/dist/index.min.js";
  initialize({}, "#${iframeId}");
</script>`
  }

  // Fixed height - no iframe-resizer script needed
  return `<iframe
  id="${iframeId}"
  src="${src}"
  height="${height}"
  scrolling="auto"
  width="100%"
  style="border: none;"
></iframe>`
}

export function EmbedGeneratorForm({ baseUrl }: { baseUrl: string }) {
  const [embedType, setEmbedType] = useState<EmbedType>('providers')
  const [options, setOptions] = useState<EmbedOptions>(initialOptions)
  const [copied, setCopied] = useState(false)

  // Fetch providers for the dropdown
  const [{ data: providersData }] = usePayloadAPI('/api/providers?limit=1000&depth=0')
  const providerOptions = useMemo(
    () =>
      providersData?.docs
        ?.filter((p: Provider | null): p is Provider => p != null && p.name != null)
        .map((p: Provider) => ({ label: p.name, value: p.slug })) || [],
    [providersData],
  )

  const embedCode = generateEmbedCode(embedType, options, baseUrl)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      toast.success('Embed code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const updateOption = <K extends keyof EmbedOptions>(key: K, value: EmbedOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const embedTypeOptions: OptionObject[] = [
    { label: 'Providers', value: 'providers' },
    { label: 'Courses', value: 'courses' },
  ]

  const heightModeOptions: OptionObject[] = [
    { label: 'Auto (adjust to content)', value: 'auto' },
    { label: 'Fixed height', value: 'fixed' },
  ]

  return (
    <div className="space-y-8">
      {/* Embed Type Selector */}
      <SelectInput
        label="Embed Type"
        name="embedType"
        path="embedType"
        options={embedTypeOptions}
        value={embedType}
        onChange={(option) => {
          if (option && 'value' in option && isEmbedType(option.value)) {
            setEmbedType(option.value)
            setOptions(initialOptions)
          }
        }}
      />

      {/* Common Options */}
      <TextInput
        label="Title (optional)"
        path="title"
        value={options.title}
        onChange={(e: ChangeEvent<HTMLInputElement>) => updateOption('title', e.target.value)}
        description="Header title to display above the embed"
      />

      {/* Height Mode */}
      <SelectInput
        label="Height Mode"
        name="heightMode"
        path="heightMode"
        options={heightModeOptions}
        value={options.heightMode}
        onChange={(option) => {
          if (option && 'value' in option && isHeightMode(option.value)) {
            updateOption('heightMode', option.value)
          }
        }}
        description="Auto height will resize the iframe to fit content. Fixed height uses a set pixel value."
      />

      {options.heightMode === 'fixed' && (
        <TextInput
          label="Fixed Height (pixels)"
          path="fixedHeight"
          value={options.fixedHeight}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateOption('fixedHeight', e.target.value)
          }
          description="Height in pixels (e.g., 800)"
        />
      )}

      {/* Courses-specific Options */}
      {embedType === 'courses' && (
        <>
          <CheckboxInput
            label="Show Filters"
            name="showFilters"
            checked={options.showFilters}
            onToggle={() => updateOption('showFilters', !options.showFilters)}
          />
          <p className="field-description">
            Display a filter sidebar allowing users to filter courses
          </p>

          <div className="field-description" style={{ marginTop: 'var(--base)' }}>
            <strong>Pre-filter options:</strong> Select values below to pre-filter the courses shown
            in the embed. Leave empty to show all courses.
          </div>

          {/* Course Types */}
          <SelectInput
            label="Course Types"
            name="courseTypes"
            path="courseTypes"
            options={courseTypesData.map((type) => ({ label: type.label, value: type.value }))}
            value={options.types}
            onChange={(selected) => {
              updateOption('types', extractStringValues(selected))
            }}
            hasMany
          />

          {/* Providers */}
          <SelectInput
            label="Providers"
            name="providers"
            path="providers"
            options={providerOptions}
            value={options.providers}
            onChange={(selected) => {
              updateOption('providers', extractStringValues(selected))
            }}
            hasMany
          />

          {/* States */}
          <SelectInput
            label="States"
            name="states"
            path="states"
            options={stateOptions.map((state) => ({ label: state.label, value: state.value }))}
            value={options.states}
            onChange={(selected) => {
              updateOption('states', extractStringValues(selected))
            }}
            hasMany
          />

          {/* Affinity Groups */}
          <SelectInput
            label="Affinity Groups"
            name="affinityGroups"
            path="affinityGroups"
            options={affinityGroupOptions.map((group) => ({
              label: group.label,
              value: group.value,
            }))}
            value={options.affinityGroups}
            onChange={(selected) => {
              updateOption('affinityGroups', extractStringValues(selected))
            }}
            hasMany
          />

          {/* Modes of Travel */}
          <SelectInput
            label="Modes of Travel"
            name="modesOfTravel"
            path="modesOfTravel"
            options={modeOfTravelOptions.map((mode) => ({ label: mode.label, value: mode.value }))}
            value={options.modesOfTravel}
            onChange={(selected) => {
              updateOption('modesOfTravel', extractStringValues(selected))
            }}
            hasMany
          />

          {/* Date Range */}
          <div style={{ display: 'flex', gap: 'var(--base)', flexWrap: 'wrap' }}>
            <div>
              <FieldLabel label="Start Date" />
              <DatePicker
                value={options.startDate}
                onChange={(date) => {
                  updateOption('startDate', date)
                  if (date && options.endDate && date > options.endDate) {
                    toast.error('Start date must be before end date')
                  }
                }}
              />
            </div>
            <div>
              <FieldLabel label="End Date" />
              <DatePicker
                value={options.endDate}
                onChange={(date) => {
                  updateOption('endDate', date)
                  if (date && options.startDate && date < options.startDate) {
                    toast.error('End date must be after start date')
                  }
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Generated Code */}
      <TextareaInput
        label="Generated Embed Code"
        path="embedCode"
        value={embedCode}
        readOnly
        rows={10}
      />

      <Button
        buttonStyle="primary"
        onClick={copyToClipboard}
        icon={copied ? <Check size={16} /> : <Copy size={16} />}
        iconPosition="left"
      >
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </Button>
    </div>
  )
}
