import type { Provider } from '@/payload-types'
import { generateProviderPublishedEmail } from '@/utilities/email/generateProviderPublishedEmail'
import { sendEmail } from '@/utilities/email/sendEmail'
import { getURL } from '@/utilities/getURL'
import type { CollectionAfterChangeHook } from 'payload'

export const sendProviderEmails: CollectionAfterChangeHook<Provider> = async ({
  doc,
  req: { payload, context },
}) => {
  // Skip if explicitly disabled by context
  if (context.disableEmailNotifications) return

  // Only process when document is published
  if (doc._status !== 'published') return

  const providerEmail = doc.notificationEmail ?? doc.email

  // Check if provider email exists
  if (!providerEmail) return

  const appUrl = getURL()

  // Query for the last published version to check if this is an initial approval or an update
  const lastPublishedVersion = await payload.findVersions({
    collection: 'providers',
    where: {
      parent: {
        equals: doc.id,
      },
      'version._status': {
        equals: 'published',
      },
    },
    sort: '-updatedAt',
    limit: 2, // Get the 2 most recent published versions (current and previous)
  })

  // If there's only one published version (the current one), this is an initial approval
  const isInitialApproval = lastPublishedVersion.docs.length === 1

  if (isInitialApproval) {
    // Provider was approved for the first time
    try {
      const emailContent = await generateProviderPublishedEmail({
        appUrl,
        providerName: doc.name,
        providerId: doc.id,
        courseTypes: doc.courseTypes || [],
      })

      await sendEmail({
        to: providerEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })

      payload.logger.info(
        `Sent provider published email to ${providerEmail} for provider ${doc.name}`,
      )
    } catch (error) {
      payload.logger.error(
        `Failed to send provider published email to ${providerEmail} for provider ${doc.name}: ${error}`,
      )
    }
  }
}
