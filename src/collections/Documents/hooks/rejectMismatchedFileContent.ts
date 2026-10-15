import { open } from 'fs/promises'
import type { CollectionConfig, File } from 'payload'
import { ValidationError } from 'payload'

type BeforeOperationHook = Exclude<
  Exclude<CollectionConfig['hooks'], undefined>['beforeOperation'],
  undefined
>[number]

// Leading bytes to inspect. Markup signatures live well inside this window even
// after a byte-order mark, an XML prolog, or leading whitespace.
const SNIFF_BYTES = 512

const PDF_MAGIC = '%PDF-'

/**
 * Matches the opening token of an HTML or SVG document, allowing for a leading
 * XML prolog and comments. KML and GPX also open with `<?xml`, so we key off the
 * first real element name rather than the prolog itself.
 */
const MARKUP_PATTERN = /<(!doctype\s+html|html[\s>]|svg[\s>])/i

const invalidFile = (message: string) =>
  new ValidationError({ errors: [{ message, path: 'file' }] })

/**
 * Throws when a file's bytes contradict the name it was uploaded under.
 *
 * Payload's own restriction check cannot catch this: for any file it cannot
 * identify from magic bytes it falls back to `getFileTypeFallback`, which
 * reports `text/plain` for unmapped extensions -- so its `validatePDF` branch
 * never runs and HTML bytes named `report.pdf` pass the allow list.
 */
export const assertFileContentMatchesName = ({ data, name }: { data: Buffer; name: string }) => {
  const head = data.subarray(0, SNIFF_BYTES).toString('utf8')

  if (MARKUP_PATTERN.test(head)) {
    throw invalidFile(
      `"${name}" contains HTML or SVG markup. Documents cannot contain markup; upload images to Media instead.`,
    )
  }

  if (name.toLowerCase().endsWith('.pdf') && !head.startsWith(PDF_MAGIC)) {
    throw invalidFile(`"${name}" is named as a PDF but its contents are not a PDF.`)
  }
}

/**
 * Client uploads arrive with an empty `data` buffer: Payload fetches the blob
 * back into `tempFilePath` instead, so the leading bytes have to come from disk.
 */
const readLeadingBytes = async ({ data, tempFilePath }: Pick<File, 'data' | 'tempFilePath'>) => {
  if (data.length > 0 || !tempFilePath) {
    return data.subarray(0, SNIFF_BYTES)
  }

  const handle = await open(tempFilePath, 'r')
  try {
    const buffer = Buffer.alloc(SNIFF_BYTES)
    const { bytesRead } = await handle.read(buffer, 0, SNIFF_BYTES, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

export const assertUploadedFileContent = async (
  file: Pick<File, 'data' | 'name' | 'tempFilePath'>,
) => assertFileContentMatchesName({ data: await readLeadingBytes(file), name: file.name })

/**
 * Documents are served from the site's own origin, so markup that slips through
 * would execute first-party. This runs on every upload path, including client
 * uploads, which Payload reads back from the blob before running hooks.
 */
export const rejectMismatchedFileContent: BeforeOperationHook = async ({ operation, req }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file) {
    return
  }

  await assertUploadedFileContent(req.file)
}
