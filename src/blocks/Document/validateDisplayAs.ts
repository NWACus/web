import { isInlineSafeMimeType } from '@/collections/Documents/allowedFileTypes'
import { isRecord } from '@/utilities/isRecord'
import { relationshipID } from '@/utilities/relationships'
import type { SelectFieldSingleValidation } from 'payload'
import { select } from 'payload/shared'

/**
 * Only PDFs are served inline; every other document type is sent as an attachment, so
 * embedding one would make the page download it on every view.
 */
export const validateDisplayAs: SelectFieldSingleValidation = async (value, options) => {
  const documentID = relationshipID(
    isRecord(options.siblingData) ? options.siblingData.document : undefined,
  )

  if (value === 'embed' && documentID !== undefined) {
    const document = await options.req.payload.findByID({
      collection: 'documents',
      id: documentID,
      depth: 0,
      disableErrors: true,
      select: { mimeType: true },
      req: options.req,
    })

    if (document && !isInlineSafeMimeType(document.mimeType)) {
      return 'Only PDFs can be embedded. Choose Download Link for this file.'
    }
  }

  return select(value, options)
}
