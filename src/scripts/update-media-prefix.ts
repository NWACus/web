/**
 * This script changes the prefix stored in the db for every row in the media table
 * to the passed prefix.
 *
 * This is useful for updating media after running the sync-blob-storage script.
 */

import { getPayload } from 'payload'
import config from '../payload.config.js'

async function updateMediaPrefix(prefix: string) {
  console.log('Starting media prefix update...')

  const payload = await getPayload({ config })

  await payload.update({
    collection: 'media',
    where: {
      prefix: { not_equals: null },
    },
    data: {
      prefix,
    },
  })
}

function showUsage() {
  console.log(`
Usage: pnpm update-media-prefix <newPrefix>

Arguments:
  newPrefix    - Prefix to change all media to

Examples:
  pnpm update-media-prefix dev
`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    showUsage()
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1)
  }

  const prefix = args[0]

  try {
    await updateMediaPrefix(prefix)
    console.log('Media prefixes updated successfully!')
  } catch (error) {
    console.error('Error during media prefix update:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()
