import type { Provider } from '@/payload-types'
import { generateProviderApplicationApproved } from '@/utilities/email/generateProviderApplicationApproved'
import { generateProviderCourseTypesUpdated } from '@/utilities/email/generateProviderCourseTypesUpdated'
import { sendEmail } from '@/utilities/email/sendEmail'
import { getURL } from '@/utilities/getURL'
import type { CollectionAfterChangeHook } from 'payload'

export const sendProviderEmails: CollectionAfterChangeHook<Provider> = async ({
  doc,
  req: { payload, context, query },
}) => {
  // Skip for autosaves
  if (query && query.autosave === 'true') return

  // Skip if explicitly disabled by context
  if (context.disableEmailNotifications) return

  // Only process when document is published
  if (doc._status !== 'published') return

  // Check if provider email exists
  if (!doc.email) return

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
    // Scenario 1: Provider was approved for the first time
    try {
      const emailContent = await generateProviderApplicationApproved({
        appUrl,
        providerName: doc.name,
        applicantEmail: doc.email,
        courseTypes: doc.courseTypes || [],
      })

      await sendEmail({
        to: doc.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })

      payload.logger.info(`Sent approval email to ${doc.email} for provider ${doc.name}`)
    } catch (error) {
      payload.logger.error(
        `Failed to send approval email to ${doc.email} for provider ${doc.name}: ${error}`,
      )
    }
  } else if (lastPublishedVersion.docs.length >= 2) {
    // Scenario 2: This is a re-publish, check if course types changed
    const previousPublishedVersion = lastPublishedVersion.docs[1].version as Provider
    const previousCourseTypes = previousPublishedVersion.courseTypes || []
    const currentCourseTypes = doc.courseTypes || []

    // Check if course types have changed
    const courseTypesChanged =
      previousCourseTypes.length !== currentCourseTypes.length ||
      previousCourseTypes.some((type) => !currentCourseTypes.includes(type)) ||
      currentCourseTypes.some((type) => !previousCourseTypes.includes(type))

    if (courseTypesChanged) {
      try {
        const emailContent = await generateProviderCourseTypesUpdated({
          appUrl,
          providerName: doc.name,
          courseTypes: currentCourseTypes,
          applicantEmail: doc.email,
        })

        await sendEmail({
          to: doc.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        })

        payload.logger.info(
          `Sent course types updated email to ${doc.email} for provider ${doc.name}`,
        )
      } catch (error) {
        payload.logger.error(
          `Failed to send course types updated email to ${doc.email} for provider ${doc.name}: ${error}`,
        )
      }
    }
  }
}
