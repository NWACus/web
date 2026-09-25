'use client'
// fallow-ignore-file unused-file
// False positive: Payload loads this by path string via the admin importMap, which fallow doesn't follow.
import type { SlugPrefixFrom } from '@/fields/slug/ensureUniqueSlug'
import { cn } from '@/utilities/ui'
import { TextFieldClientProps } from 'payload'
import React, { useCallback, useEffect, useState } from 'react'

import {
  Button,
  FieldDescription,
  FieldLabel,
  TextInput,
  useField,
  useFormFields,
} from '@payloadcms/ui'

import { relationshipID } from '@/utilities/relationships'
import { RefreshCw } from 'lucide-react'
import { composeSlug, formatDateForSlug, formatSlug, slugOf } from './formatSlug'

type SlugComponentProps = {
  fieldToUse: string
  dateField?: string
  prefixFrom?: SlugPrefixFrom
} & TextFieldClientProps

// Fetches the related document's slug so the regenerate button can mirror the server-side prefix.
const usePrefixSlug = (prefixFrom: SlugPrefixFrom | undefined): string => {
  const relationshipField = prefixFrom?.field
  const relatedCollection = prefixFrom?.collection
  const relatedID = useFormFields(([fields]) =>
    relationshipField ? relationshipID(fields[relationshipField]?.value) : undefined,
  )
  const [prefixSlug, setPrefixSlug] = useState('')

  useEffect(() => {
    // Clear the previous document's slug so ↻ can't use it while the new one loads (or if it fails)
    setPrefixSlug('')
    if (!relatedCollection || relatedID === undefined) {
      return
    }

    let cancelled = false
    const fetchPrefixSlug = async () => {
      try {
        const response = await fetch(
          `/api/${relatedCollection}/${relatedID}?depth=0&select[slug]=true`,
        )
        const slug = response.ok ? slugOf(await response.json()) : ''
        if (!cancelled) setPrefixSlug(slug)
      } catch (error) {
        console.error(`Failed to fetch ${relatedCollection} slug:`, error)
      }
    }

    fetchPrefixSlug()
    return () => {
      cancelled = true
    }
  }, [relatedCollection, relatedID])

  return prefixSlug
}

export const SlugComponent = ({
  field,
  fieldToUse,
  dateField,
  prefixFrom,
  path,
  readOnly: readOnlyFromProps,
}: SlugComponentProps) => {
  const { label } = field
  const description = field?.admin?.description

  const { value, setValue } = useField<string>({ path: path || field.name })
  const { value: currentSlug } = useField<string>({ path: 'slug' })

  const [spinning, setSpinning] = useState(false)

  // Read the source field and the optional date as primitive strings so the subscription stays
  // referentially stable across renders.
  const baseSlug = useFormFields(([fields]) => {
    const fieldValue = fields[fieldToUse]?.value
    return typeof fieldValue === 'string' ? formatSlug(fieldValue) : ''
  })
  const dateSlug = useFormFields(([fields]) =>
    dateField ? formatDateForSlug(fields[dateField]?.value) : '',
  )
  const prefixSlug = usePrefixSlug(prefixFrom)

  const handleGenerate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setSpinning(true)
      window.setTimeout(() => setSpinning(false), 300)
      const newSlug = composeSlug({ prefix: prefixSlug, base: baseSlug, date: dateSlug })
      if (newSlug && newSlug !== currentSlug) {
        setValue(newSlug)
      }
    },
    [prefixSlug, baseSlug, dateSlug, currentSlug, setValue],
  )
  const readOnly = readOnlyFromProps || false

  return (
    <div className="field-type relative">
      <div className="flex justify-between items-center">
        <FieldLabel htmlFor={`field-${path}`} label={label} required />

        <Button
          className="absolute right-1 top-9 z-[1] m-0 p-1 bg-[var(--theme-input-bg)]"
          buttonStyle="icon-label"
          onClick={handleGenerate}
        >
          <RefreshCw className={cn('w-4', spinning && 'animate-spin [animation-duration:300ms]')} />
        </Button>
      </div>

      <TextInput
        value={value}
        onChange={setValue}
        path={path || field.name}
        readOnly={Boolean(readOnly)}
      />

      {description && <FieldDescription description={description} path={path || field.name} />}
    </div>
  )
}
