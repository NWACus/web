'use client'

import { isRecord } from '@/utilities/isRecord'
import { relationshipID } from '@/utilities/relationships'
import { TextField, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { useEffect, useRef } from 'react'

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

const docTitle = (doc: unknown): string | undefined =>
  isRecord(doc) ? nonEmptyString(doc.displayName ?? doc.title) : undefined

const referenceUrl = (reference: unknown): string | undefined => {
  if (!isRecord(reference)) return undefined
  const collection = nonEmptyString(reference.relationTo)
  const id = relationshipID(reference.value)
  return collection && id !== undefined ? `/api/${collection}/${id}?depth=0` : undefined
}

const fetchReferenceTitle = async (reference: unknown): Promise<string | undefined> => {
  const url = referenceUrl(reference)
  if (!url) return undefined
  const response = await fetch(url)
  return response.ok ? docTitle(await response.json()) : undefined
}

// Mounts when an item gets its first sub-item, so the section starts out named after the
// link it replaces rather than blank.
export const SectionLabelField: TextFieldClientComponent = (props) => {
  const { path } = props
  const { value, setValue } = useField<string>({ path })
  // <tab>.items.<i>.label → <tab>.items.<i>.link
  const linkPath = path.replace(/\.label$/, '.link')
  const linkLabel = useFormFields(([fields]) => fields[`${linkPath}.label`]?.value)
  const reference = useFormFields(([fields]) => fields[`${linkPath}.reference`]?.value)
  const prefilled = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Runs once: form-state refreshes would otherwise cancel or repeat the title lookup
  useEffect(() => {
    if (prefilled.current || value) return
    prefilled.current = true

    const label = nonEmptyString(linkLabel)
    const title = label ? Promise.resolve(label) : fetchReferenceTitle(reference)
    title
      .then((name) => {
        if (name && mounted.current) setValue(name)
      })
      .catch(() => {})
  }, [linkLabel, reference, setValue, value])

  return <TextField {...props} />
}
