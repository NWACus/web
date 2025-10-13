/**
 * Database sanitization script for sync-prod-to-dev workflow
 * This script sanitizes user data by:
 * 1. Updating emails to format: developer+{environment friendly name}-{user's id}@nwac.us
 * 2. Updating names to format: {environment friendly name}-{user's name}
 * 3. Updating passwords to use NON_PROD_SYNC_PASSWORD (or generated UUID fallback)
 * 4. Preserving all other user data
 */

import { getPayload } from 'payload'
import { v4 as uuid } from 'uuid'
import { emailDefaultReplyToAddress } from '../email-adapter'
import config from '../payload.config.js'
import { createEmailAlias } from '../utilities/createEmailAlias'

async function sanitizeDatabase() {
  console.log('Starting database sanitization...')

  const payload = await getPayload({ config })

  let password: string
  if (process.env.NON_PROD_SYNC_PASSWORD) {
    password = process.env.NON_PROD_SYNC_PASSWORD
    payload.logger.info(`Using NON_PROD_SYNC_PASSWORD from environment`)
  } else {
    password = uuid()
    payload.logger.info(`NON_PROD_SYNC_PASSWORD not set, using generated password.`)
  }

  try {
    const users = await payload.find({
      collection: 'users',
      limit: 1000,
      depth: 0,
    })

    console.log(`Found ${users.docs.length} users to sanitize`)

    for (const user of users.docs) {
      const anonymizedEmail = createEmailAlias({
        plusAddress: user.id,
        baseAddress: emailDefaultReplyToAddress,
      })
      const anonymizedName = `User ${user.id}`

      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          name: anonymizedName,
          email: anonymizedEmail,
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

await sanitizeDatabase()
