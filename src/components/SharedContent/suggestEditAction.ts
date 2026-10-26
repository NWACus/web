'use server'

import { isSharedContentCollection, MAX_SUGGESTION_LENGTH } from '@/constants/sharedContent'
import { emailDefaultReplyToAddress } from '@/email-adapter'
import type { User } from '@/payload-types'
import { collectionLabel, documentTitle } from '@/utilities/collectionLabel'
import { generateSharedContentSuggestionEmail } from '@/utilities/email/generateSharedContentSuggestionEmail'
import { sendEmail } from '@/utilities/email/sendEmail'
import { getURL } from '@/utilities/getURL'
import { getUser } from '@/utilities/isUser'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, Payload } from 'payload'
import { formatAdminURL } from 'payload/shared'

type SuggestEditResult = { success: true } | { success: false; error: string }

const NOT_ALLOWED: SuggestEditResult = {
  success: false,
  error: 'You are not allowed to perform that action.',
}

// Best effort and per server instance: login is the real guard, this stops one tab looping
const COOLDOWN_MS = 60_000
const lastSentAt = new Map<number, number>()

function isCoolingDown(userId: number): boolean {
  const last = lastSentAt.get(userId)
  return last !== undefined && Date.now() - last < COOLDOWN_MS
}

// Server-action arguments arrive untyped, whatever the signature says
function suggestionError(suggestion: unknown): string | null {
  if (typeof suggestion !== 'string' || !suggestion.trim()) {
    return 'Please describe the change you have in mind.'
  }
  if (suggestion.trim().length > MAX_SUGGESTION_LENGTH) {
    return `Please keep it under ${MAX_SUGGESTION_LENGTH} characters.`
  }
  return null
}

/** A populated tenant carries only its slug (Tenants' `defaultPopulate`), so names need a query. */
async function centersForUser(payload: Payload, user: User): Promise<string> {
  const ids = roleAssignmentsForUser(payload.logger, user).map(({ tenant }) =>
    typeof tenant === 'number' ? tenant : tenant.id,
  )
  if (ids.length === 0) return ''

  const { docs } = await payload.find({
    collection: 'tenants',
    where: { id: { in: [...new Set(ids)] } },
    select: { name: true },
    depth: 0,
    limit: 0,
  })
  return docs.map((tenant) => tenant.name).join(', ')
}

async function send({
  payload,
  user,
  collectionSlug,
  id,
  doc,
  suggestion,
}: {
  payload: Payload
  user: User
  collectionSlug: string
  id: number
  doc: unknown
  suggestion: string
}): Promise<void> {
  const serverURL = getURL((await headers()).get('host'))
  const { html, text, subject } = await generateSharedContentSuggestionEmail({
    appUrl: serverURL,
    adminUrl: formatAdminURL({
      adminRoute: payload.config.routes.admin,
      path: `/collections/${collectionSlug}/${id}`,
      serverURL,
    }),
    collectionLabel: collectionLabel(payload, collectionSlug),
    documentTitle: documentTitle(payload, collectionSlug, doc) ?? `#${id}`,
    suggesterName: user.name,
    suggesterEmail: user.email,
    suggesterCenters: await centersForUser(payload, user),
    suggestion,
  })

  await sendEmail({
    html,
    text,
    subject,
    to: process.env.SHARED_CONTENT_SUGGESTIONS_EMAIL || emailDefaultReplyToAddress,
    replyTo: user.email,
  })
}

export async function suggestEditAction({
  collectionSlug,
  id,
  suggestion,
}: {
  collectionSlug: string
  id: number
  suggestion: string
}): Promise<SuggestEditResult> {
  const invalid = suggestionError(suggestion)
  if (invalid) return { success: false, error: invalid }
  if (!isSharedContentCollection(collectionSlug) || typeof id !== 'number') return NOT_ALLOWED

  const payload = await getPayload({ config })
  const user = getUser(await payload.auth({ headers: await headers() }))
  if (!user) return NOT_ALLOWED
  if (isCoolingDown(user.id)) {
    return { success: false, error: 'You just sent a suggestion. Please wait a minute.' }
  }

  let doc: unknown
  try {
    // Confirms the suggester can actually see what they are commenting on
    doc = await payload.findByID({
      collection: collectionSlug,
      id,
      user,
      overrideAccess: false,
      depth: 0,
    })
  } catch {
    return NOT_ALLOWED
  }

  try {
    await send({ payload, user, collectionSlug, id, doc, suggestion: suggestion.trim() })
  } catch (error) {
    payload.logger.error(
      `Failed to send shared content suggestion for ${collectionSlug} ${id}: ${error instanceof Error ? error.message : error}`,
    )
    return { success: false, error: 'Could not send your suggestion. Please try again.' }
  }

  lastSentAt.set(user.id, Date.now())
  return { success: true }
}
