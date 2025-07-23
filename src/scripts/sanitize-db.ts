/**
 * Database sanitization script for sync-prod-to-dev workflow
 * This script sanitizes user data by:
 * 1. Updating emails to format: developer+{original_email}@nwac.us
 * 2. Updating passwords to use PAYLOAD_SEED_PASSWORD (properly hashed)
 * 3. Preserving all other user data
 */

import { getPayload } from 'payload'
import { emailDefaultReplyToAddress } from '../email-adapter'
import config from '../payload.config.js'
import { createEmailAlias } from '../utilities/createEmailAlias'

async function sanitizeDatabase() {
  console.log('Starting database sanitization...')

  const payload = await getPayload({ config })

  if (!process.env.PAYLOAD_SEED_PASSWORD && process.env.ALLOW_SIMPLE_PASSWORDS !== 'true') {
    payload.logger.fatal(
      "$PAYLOAD_SEED_PASSWORD missing and ALLOW_SIMPLE_PASSWORDS not set to 'true' - either opt into simple passwords or provide a seed password.",
    )
    process.exit(1)
  }
  const password = process.env.PAYLOAD_SEED_PASSWORD || 'localpass'
  payload.logger.info(`Using password '${password}'...`)

  try {
    const users = await payload.find({
      collection: 'users',
      limit: 1000,
      depth: 0,
    })

    console.log(`Found ${users.docs.length} users to sanitize`)

    for (const user of users.docs) {
      const originalEmail = user.email
      const sanitizedEmail = createEmailAlias(originalEmail, emailDefaultReplyToAddress)

      console.log(`Updating user: ${originalEmail} -> ${sanitizedEmail}`)

      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          email: sanitizedEmail,
          password: password,
          resetPasswordToken: null,
          resetPasswordExpiration: null,
          inviteToken: null,
          inviteExpiration: null,
        },
      })
    }

    console.log('Database sanitization completed successfully!')
  } catch (error) {
    console.error('Error during sanitization:', error)
    process.exit(1)
  }

  process.exit(0)
}

sanitizeDatabase()
