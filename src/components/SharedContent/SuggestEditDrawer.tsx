'use client'

import { MAX_SUGGESTION_LENGTH } from '@/constants/sharedContent'
import { isRecord } from '@/utilities/isRecord'
import {
  Button,
  Drawer,
  Form,
  FormSubmit,
  TextareaField,
  toast,
  useDocumentInfo,
  useModal,
} from '@payloadcms/ui'
import type { CollectionSlug, FormState } from 'payload'
import { useCallback, useState } from 'react'
import { suggestEditAction } from './suggestEditAction'

const drawerSlug = 'suggest-shared-content-edit-drawer'

const initialState: FormState = {
  suggestion: { initialValue: '', valid: true, value: '' },
}

// Whichever of these a shared collection happens to use as its human-readable name
const TITLE_KEYS = ['title', 'filename', 'name', 'alt']

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

function titleFor(data: unknown): string {
  const record: Record<string, unknown> = isRecord(data) ? { ...data } : {}
  return TITLE_KEYS.map((key) => record[key]).find(isNonEmptyString) ?? 'this document'
}

type SuggestTarget = { collectionSlug: CollectionSlug; id: number }

// Nothing to suggest to yourself: an editor who can update the document just edits it.
function suggestTarget({
  id,
  collectionSlug,
  canUpdate,
}: {
  id?: number | string
  collectionSlug?: CollectionSlug
  canUpdate: boolean
}): SuggestTarget | null {
  if (canUpdate) return null
  if (typeof id !== 'number') return null
  if (!collectionSlug) return null
  return { collectionSlug, id }
}

function readSuggestion(formState: FormState): string {
  const value = formState.suggestion?.value
  return typeof value === 'string' ? value : ''
}

function SuggestEditForm({
  collectionSlug,
  id,
  documentTitle,
}: {
  collectionSlug: CollectionSlug
  id: number
  documentTitle: string
}) {
  const { openModal, closeModal } = useModal()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (formState: FormState) => {
      setIsSubmitting(true)
      try {
        const result = await suggestEditAction({
          collectionSlug,
          id,
          documentTitle,
          suggestion: readSuggestion(formState),
        })
        if (result.success) {
          toast.success('Your suggestion is on its way to a shared content editor.')
          closeModal(drawerSlug)
          return
        }
        toast.error(result.error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [closeModal, collectionSlug, documentTitle, id],
  )

  return (
    <>
      <Button buttonStyle="secondary" onClick={() => openModal(drawerSlug)}>
        Suggest an Edit
      </Button>
      <Drawer slug={drawerSlug} title="Suggest an Edit">
        <Form
          initialState={initialState}
          onSubmit={handleSubmit}
          disableValidationOnSubmit={true}
          className="space-y-8 pt-8"
        >
          <TextareaField
            field={{
              name: 'suggestion',
              type: 'textarea',
              label: 'What should change?',
              required: true,
              maxLength: MAX_SUGGESTION_LENGTH,
              admin: {
                description:
                  'This goes to a shared content editor as an email, with your address as the reply-to, so they can write back.',
                rows: 8,
              },
            }}
            path="suggestion"
          />
          <FormSubmit className="w-fit px-6" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Suggestion'}
          </FormSubmit>
        </Form>
      </Drawer>
    </>
  )
}

/**
 * The route out of a shared document for the people who can read it but not change it — decision 6
 * of docs/decisions/022-shared-content.md. Registered through `beforeDocumentControls` by every
 * Shared Content collection; `SHARED_CONTENT_EDIT_CONTROLS` in src/constants/sharedContent.ts is
 * the list to spread.
 */
export function SuggestEditDrawer() {
  const { id, collectionSlug, docPermissions, savedDocumentData } = useDocumentInfo()

  const target = suggestTarget({
    id,
    collectionSlug,
    canUpdate: docPermissions?.update === true,
  })
  if (!target) return null

  return <SuggestEditForm {...target} documentTitle={titleFor(savedDocumentData)} />
}
