import { CollectionConfig, ValidationError } from 'payload'

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
 * Documents are served from the site's own origin, so markup that slips through
 * would execute first-party. This runs on every path that reaches the server:
 * local development, the Local API used by seeding, and any REST upload.
 * Direct-to-blob client uploads never reach a hook, which is why the response
 * headers in the collection config are the backstop rather than this hook.
 */
export const rejectMismatchedFileContent: BeforeOperationHook = ({ operation, req }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file) {
    return
  }

  assertFileContentMatchesName(req.file)
}
