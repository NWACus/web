'use server'

import { generateProviderApplicationConfirmation } from '@/utilities/email/generateProviderApplicationConfirmation'
import { generateProviderApplicationNotification } from '@/utilities/email/generateProviderApplicationNotification'
import { sendEmail } from '@/utilities/email/sendEmail'
import { getURL } from '@/utilities/getURL'
import config from '@payload-config'
import { getPayload } from 'payload'

export type CourseType = 'rec-1' | 'rec-2' | 'pro-1' | 'pro-2' | 'rescue' | 'awareness-external'
type StateCode =
  | 'AL'
  | 'AK'
  | 'AZ'
  | 'AR'
  | 'CA'
  | 'CO'
  | 'CT'
  | 'DE'
  | 'FL'
  | 'GA'
  | 'HI'
  | 'ID'
  | 'IL'
  | 'IN'
  | 'IA'
  | 'KS'
  | 'KY'
  | 'LA'
  | 'ME'
  | 'MD'
  | 'MA'
  | 'MI'
  | 'MN'
  | 'MS'
  | 'MO'
  | 'MT'
  | 'NE'
  | 'NV'
  | 'NH'
  | 'NJ'
  | 'NM'
  | 'NY'
  | 'NC'
  | 'ND'
  | 'OH'
  | 'OK'
  | 'OR'
  | 'PA'
  | 'RI'
  | 'SC'
  | 'SD'
  | 'TN'
  | 'TX'
  | 'UT'
  | 'VT'
  | 'VA'
  | 'WA'
  | 'WV'
  | 'WI'
  | 'WY'
  | 'DC'

export type ProviderApplicationData = {
  name: string
  details: string
  email: string
  phone?: string
  website?: string
  experience?: string
  courseTypes: CourseType[]
  address?: string
  city?: string
  state: StateCode
  zip?: string
  country?: string
}

export type ProviderApplicationResult =
  | { success: true; message: string }
  | { success: false; error: string }

export async function submitProviderApplication(
  data: ProviderApplicationData,
): Promise<ProviderApplicationResult> {
  try {
    const payload = await getPayload({ config })

    // Build location object
    const locationData: {
      country: 'US'
      state: StateCode
      address?: string
      city?: string
      zip?: string
    } = {
      country: 'US',
      state: data.state,
    }

    // Only add optional fields if they have values
    if (data.address) locationData.address = data.address
    if (data.city) locationData.city = data.city
    if (data.zip) locationData.zip = data.zip

    // Create draft provider
    const provider = await payload.create({
      collection: 'providers',
      data: {
        name: data.name,
        details: data.details,
        email: data.email,
        phone: data.phone || undefined,
        website: data.website || undefined,
        experience: data.experience || undefined,
        courseTypesAppliedFor: data.courseTypes,
        location: locationData,
      },
      draft: true,
    })

    try {
      // Get notification receivers from aaaManagement global
      const aaaManagement = await payload.findGlobal({
        slug: 'aaaManagement',
        depth: 1, // Populate user relationships
      })

      const notificationReceivers = Array.isArray(aaaManagement.notificationReceivers)
        ? aaaManagement.notificationReceivers
        : []

      // Send notification emails to admins
      if (notificationReceivers.length > 0) {
        const adminEmailPromises = notificationReceivers.map(async (receiver) => {
          if (typeof receiver === 'object' && receiver.email) {
            const emailContent = await generateProviderApplicationNotification({
              providerName: data.name,
              providerDetails: data.details,
              courseTypes: data.courseTypes,
              email: data.email,
              phone: data.phone,
              website: data.website,
              experience: data.experience,
              location: locationData.state,
              providerId: provider.id,
              appUrl: getURL(),
            })

            await sendEmail({
              to: receiver.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            })
          }
        })

        await Promise.all(adminEmailPromises)
      }

      // Send confirmation email to applicant
      const confirmationEmail = await generateProviderApplicationConfirmation({
        providerName: data.name,
        applicantEmail: data.email,
        appUrl: getURL(),
      })

      await sendEmail({
        to: data.email,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
        text: confirmationEmail.text,
      })
    } catch (err) {
      payload.logger.error(err, 'Failed to send provider application emails.')
    }

    return {
      success: true,
      message:
        'Your application has been submitted successfully! We will review it and get back to you soon. You should receive a confirmation email shortly.',
    }
  } catch (error) {
    console.error('Error submitting provider application:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit application',
    }
  }
}
