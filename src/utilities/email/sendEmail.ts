import { emailDefaultReplyToAddress } from '@/email-adapter'
import configPromise from '@payload-config'
import { getPayload, SendEmailOptions } from 'payload'

export async function sendEmail(options: SendEmailOptions) {
  const payload = await getPayload({ config: configPromise })
  return payload.email.sendEmail({
    replyTo: emailDefaultReplyToAddress,
    ...options,
  })
}
