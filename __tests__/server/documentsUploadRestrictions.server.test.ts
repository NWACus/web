import { ValidationError } from 'payload'

import { DOCUMENT_MIME_TYPES } from '../../src/collections/Documents/allowedFileTypes'
import { assertFileContentMatchesName } from '../../src/collections/Documents/hooks/rejectMismatchedFileContent'
import { modifyDocumentResponseHeaders } from '../../src/collections/Documents/modifyDocumentResponseHeaders'

const runHook = (name: string, contents: string) =>
  assertFileContentMatchesName({ data: Buffer.from(contents), name })

/**
 * Payload's ValidationError always carries the generic "following field is
 * invalid" text at the top level, so the reason a reviewer cares about lives in
 * the per-field errors. Matching Payload's own file-restriction errors keeps the
 * message attached to the `file` field in the admin UI.
 */
const rejectionReason = (run: () => void): string => {
  try {
    run()
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.data.errors.map((fieldError) => fieldError.message).join(' ')
    }

    return ''
  }

  throw new Error('expected the upload to be rejected, but it was allowed')
}

describe('Documents upload allow list', () => {
  it('does not accept images or videos, which belong in Media', () => {
    const media = DOCUMENT_MIME_TYPES.filter(
      (type) => type.startsWith('image/') || type.startsWith('video/'),
    )

    expect(media).toEqual([])
  })

  it('never accepts markup that would execute on the site origin', () => {
    for (const type of ['text/html', 'application/xhtml+xml', 'image/svg+xml']) {
      expect(DOCUMENT_MIME_TYPES).not.toContain(type)
    }
  })

  it('does not accept the octet-stream catch-all', () => {
    expect(DOCUMENT_MIME_TYPES).not.toContain('application/octet-stream')
  })

  it('keeps the generic XML types KML and GPX are detected as', () => {
    // fileTypeFromBuffer reports both as application/xml, and Payload validates
    // the detected type, so dropping these would break geospatial uploads.
    expect(DOCUMENT_MIME_TYPES).toContain('application/xml')
  })

  it('accepts the plain-text and Office types editors actually need', () => {
    for (const type of [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]) {
      expect(DOCUMENT_MIME_TYPES).toContain(type)
    }
  })
})

describe('assertFileContentMatchesName', () => {
  it('rejects HTML smuggled under an allowed extension', () => {
    // Payload's own check cannot catch this: it falls back to the extension,
    // which reports text/plain for .pdf, so its validatePDF branch never runs.
    expect(rejectionReason(() => runHook('report.pdf', '<!doctype html><body>x</body>'))).toMatch(
      /markup/i,
    )
  })

  it('rejects SVG content regardless of the filename', () => {
    expect(
      rejectionReason(() =>
        runHook('diagram.kml', '<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      ),
    ).toMatch(/markup/i)
  })

  it('rejects a file named .pdf that is not a PDF', () => {
    expect(rejectionReason(() => runHook('report.pdf', 'PK not a pdf'))).toMatch(/not a PDF/i)
  })

  it('allows a genuine PDF', () => {
    expect(() => runHook('report.pdf', '%PDF-1.7 1 0 obj')).not.toThrow()
  })

  it('allows KML, which opens with an XML prolog rather than markup', () => {
    expect(() =>
      runHook('zones.kml', '<?xml version="1.0"?><kml><Document></Document></kml>'),
    ).not.toThrow()
  })

  it('allows plain text and CSV', () => {
    expect(() => runHook('notes.txt', 'field observations')).not.toThrow()
    expect(() => runHook('data.csv', 'station,temp')).not.toThrow()
  })
})

describe('Documents response headers', () => {
  const modify = (contentType: string, disposition?: string) => {
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    if (disposition) {
      headers.set('Content-Disposition', disposition)
    }

    return modifyDocumentResponseHeaders({ headers })
  }

  it('always pins the declared content type', () => {
    expect(modify('application/pdf').get('X-Content-Type-Options')).toBe('nosniff')
    expect(modify('text/csv').get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('leaves PDFs inline so the embed layout keeps working', () => {
    const headers = modify('application/pdf', 'inline; filename="a.pdf"')

    expect(headers.get('Content-Disposition')).toBe('inline; filename="a.pdf"')
  })

  it('forces everything else to download, preserving the filename', () => {
    const headers = modify('text/csv', 'inline; filename="data.csv"')

    expect(headers.get('Content-Disposition')).toBe('attachment; filename="data.csv"')
  })

  it('downloads by default when no disposition was set', () => {
    expect(modify('application/xml').get('Content-Disposition')).toBe('attachment')
  })

  it('ignores charset parameters when deciding', () => {
    const headers = modify('application/pdf; charset=binary', 'inline; filename="a.pdf"')

    expect(headers.get('Content-Disposition')).toBe('inline; filename="a.pdf"')
  })
})
