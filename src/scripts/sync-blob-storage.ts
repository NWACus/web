/**
 * Blob storage sync script for copying files between prefixes
 * This script copies all files from a source prefix to a destination prefix
 * Only copies files that don't already exist in the destination
 */

import { BlobNotFoundError, copy, head, list } from '@vercel/blob'
import 'dotenv/config'

async function syncBlobStorage({
  sourcePrefix,
  destinationPrefix,
  batchSize = 250,
  dryRun = false,
}: {
  sourcePrefix: string
  destinationPrefix: string
  batchSize?: number
  dryRun?: boolean
}) {
  console.log(`Starting blob sync from '${sourcePrefix}' to '${destinationPrefix}'`)
  console.log(`Dry run: ${dryRun}`)

  let cursor: string | undefined
  let totalFiles = 0
  let copiedFiles = 0
  let skippedFiles = 0

  do {
    const listResult = await list({
      cursor,
      limit: batchSize,
      prefix: sourcePrefix,
      token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    })

    console.log(`Processing batch of ${listResult.blobs.length} files...`)

    if (listResult.blobs.length > 0) {
      const copyPromises = listResult.blobs.map(async (blob) => {
        totalFiles++

        const relativePath = blob.pathname.replace(sourcePrefix, '')
        const destinationPath = `${destinationPrefix}${relativePath}`

        console.log(`relativePath: ${relativePath} | destinationPath: ${destinationPath}`)

        try {
          // Check if file already exists in destination
          await head(destinationPath, {
            token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
          })
          console.log(`Skipping existing file: ${destinationPath}`)
          skippedFiles++
          return
        } catch (error) {
          if (!(error instanceof BlobNotFoundError)) {
            console.error(`Error checking existence of ${destinationPath}:`, error)
            return
          }
        }

        if (dryRun) {
          console.log(`Would copy: ${blob.pathname} -> ${destinationPath}`)
          copiedFiles++
          return
        }

        try {
          await copy(blob.pathname, destinationPath, {
            access: 'public',
            token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
          })

          console.log(`Copied: ${blob.pathname} -> ${destinationPath}`)
          copiedFiles++
        } catch (error) {
          console.error(`Error copying ${blob.pathname}:`, error)
        }
      })

      await Promise.all(copyPromises)
    }

    cursor = listResult.cursor
  } while (cursor)

  console.log(`\n📊 Sync Summary:`)
  console.log(`   Total files found: ${totalFiles}`)
  console.log(`   Files copied: ${copiedFiles}`)
  console.log(`   Files skipped: ${skippedFiles}`)
  if (dryRun) {
    console.log('(Dry run - no actual changes made)')
  }
}

function showUsage() {
  console.log(`
Usage: pnpm sync-blobs <sourcePrefix> <destinationPrefix> [options]

Arguments:
  sourcePrefix      - Source prefix to copy files from (e.g., 'prod')
  destinationPrefix - Destination prefix to copy files to (e.g., 'dev')

Options:
  --dry-run         - Show what would be copied without making changes
  --batch-size N    - Number of files to process at once (default: 250)

Examples:
  pnpm sync-blobs prod dev
  pnpm sync-blobs prod dev --dry-run
  pnpm sync-blobs prod dev --batch-size 100

Environment Variables:
  VERCEL_BLOB_READ_WRITE_TOKEN - Required Vercel Blob API token
`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    showUsage()
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1)
  }

  const sourcePrefix = args[0]
  const destinationPrefix = args[1]

  const dryRun = args.includes('--dry-run')
  const batchSizeIndex = args.indexOf('--batch-size')
  const batchSize =
    batchSizeIndex !== -1 && args[batchSizeIndex + 1] ? parseInt(args[batchSizeIndex + 1], 10) : 250

  if (!process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    console.error('VERCEL_BLOB_READ_WRITE_TOKEN environment variable is required')
    process.exit(1)
  }

  try {
    await syncBlobStorage({
      sourcePrefix,
      destinationPrefix,
      batchSize,
      dryRun,
    })

    console.log('Blob sync completed successfully!')
  } catch (error) {
    console.error('Error during blob sync:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()
