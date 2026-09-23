'use server'

import { MAX_SUGGESTION_LENGTH } from '@/constants/sharedContent'
import { emailDefaultReplyToAddress } from '@/email-adapter'
import { collectionLabel } from '@/utilities/collectionLabel'
import { generateSharedContentSuggestionEmail } from '@/utilities/email/generateSharedContentSuggestionEmail'
import { sendEmail } from '@/utilities/email/sendEmail'
import { getURL } from '@/utilities/getURL'
import { getUser } from '@/utilities/isUser'
import { roleAssignmentsForUser } from '@/utilities/rbac/roleAssignmentsForUser'
import config from '@payload-config'
import { headers } from 'next/headers'
import { CollectionSlug, getPayload, Payload } from 'payload'
import { formatAdminURL } from 'payload/shared'

type SuggestEditResult = { success: true } | { success: false; error: string }

function centersForUser(payload: Payload, user: Parameters<typeof roleAssignmentsForUser>[1]) {
  const names = roleAssignmentsForUser(payload.logger, user)
    .map((assignment) => assignment.tenant)
    .filter((tenant) => typeof tenant !== 'number')
    .map((tenant) => tenant.name)
  return [...new Set(names)].join(', ')
}

export async function suggestEditAction({
  collectionSlug,
  id,
  documentTitle,
  suggestion,
}: {
  collectionSlug: CollectionSlug
  id: number
  documentTitle: string
  suggestion: string
}): Promise<SuggestEditResult> {
  const trimmed = suggestion.trim()
  if (!trimmed) return { success: false, error: 'Please describe the change you have in mind.' }
  if (trimmed.length > MAX_SUGGESTION_LENGTH) {
    return {
      success: false,
      error: `Please keep it under ${MAX_SUGGESTION_LENGTH} characters.`,
    }
  }

  const payload = await getPayload({ config })
  const headersList = await headers()
  const user = getUser(await payload.auth({ headers: headersList }))

  if (!user) return { success: false, error: 'You are not allowed to perform that action.' }

  try {
    // Confirms the suggester can actually see what they are commenting on
    await payload.findByID({
      collection: collectionSlug,
      id,
      user,
      overrideAccess: false,
      depth: 0,
    })
  } catch {
    return { success: false, error: 'You are not allowed to perform that action.' }
  }

  const serverURL = getURL(headersList.get('host'))
  const { html, text, subject } = await generateSharedContentSuggestionEmail({
    appUrl: serverURL,
    adminUrl: formatAdminURL({
      adminRoute: payload.config.routes.admin,
      path: `/collections/${collectionSlug}/${id}`,
      serverURL,
    }),
    collectionLabel: collectionLabel(payload, collectionSlug),
    documentTitle,
    suggesterName: user.name,
    suggesterEmail: user.email,
    suggesterCenters: centersForUser(payload, user),
    suggestion: trimmed,
  })

  try {
    await sendEmail({
      html,
      text,
      subject,
      to: process.env.SHARED_CONTENT_SUGGESTIONS_EMAIL || emailDefaultReplyToAddress,
      replyTo: user.email,
    })
  } catch (error) {
    payload.logger.error(
      `Failed to send shared content suggestion for ${collectionSlug} ${id}: ${error instanceof Error ? error.message : error}`,
    )
    return { success: false, error: 'Could not send your suggestion. Please try again.' }
  }

  return { success: true }
}
