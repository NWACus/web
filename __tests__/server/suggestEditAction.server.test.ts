jest.mock('../../src/payload.config', () => ({}))

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => new Headers({ host: 'nwac.localhost:3000' })),
}))

jest.mock('../../src/utilities/email/sendEmail', () => ({
  sendEmail: jest.fn(async () => undefined),
}))

jest.mock('../../src/utilities/email/generateSharedContentSuggestionEmail', () => ({
  generateSharedContentSuggestionEmail: jest.fn(async (props: { documentTitle: string }) => ({
    html: '<p>html</p>',
    text: 'text',
    subject: `Suggested edit: ${props.documentTitle}`,
  })),
}))

const mockAuth = jest.fn()
const mockFindByID = jest.fn()
const mockLogger = { error: jest.fn(), info: jest.fn() }

jest.mock('payload', () => ({
  getPayload: jest.fn(async () => ({
    auth: mockAuth,
    findByID: mockFindByID,
    logger: mockLogger,
    config: {
      routes: { admin: '/admin' },
      collections: [{ slug: 'sharedMedia', labels: { singular: 'Shared Media' } }],
    },
  })),
}))

import { suggestEditAction } from '@/components/SharedContent/suggestEditAction'
import { MAX_SUGGESTION_LENGTH } from '@/constants/sharedContent'
import { generateSharedContentSuggestionEmail } from '@/utilities/email/generateSharedContentSuggestionEmail'
import { sendEmail } from '@/utilities/email/sendEmail'

const timestamps = { createdAt: '2026-09-21T00:00:00.000Z', updatedAt: '2026-09-21T00:00:00.000Z' }

const suggester = {
  id: 1,
  name: 'NWAC Admin',
  email: 'admin@nwac.us',
  collection: 'users',
  roles: {
    docs: [
      {
        id: 1,
        role: { id: 1, name: 'Admin', rules: [], ...timestamps },
        tenant: {
          id: 1,
          slug: 'nwac',
          name: 'Northwest Avalanche Center',
          provisioning: { status: 'complete' },
          ...timestamps,
        },
        ...timestamps,
      },
    ],
  },
  ...timestamps,
}

const validCall = {
  collectionSlug: 'sharedMedia' as const,
  id: 7,
  documentTitle: 'shared-image-mountain.png',
  suggestion: '  The credit should name the photographer.  ',
}

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.SHARED_CONTENT_SUGGESTIONS_EMAIL
  mockAuth.mockResolvedValue({ user: suggester })
  mockFindByID.mockResolvedValue({ id: 7 })
})

describe('suggestEditAction', () => {
  it('refuses an empty suggestion without touching the mailer', async () => {
    await expect(suggestEditAction({ ...validCall, suggestion: '   ' })).resolves.toEqual({
      success: false,
      error: expect.any(String),
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('caps the length so nobody pastes a document into it', async () => {
    const result = await suggestEditAction({
      ...validCall,
      suggestion: 'x'.repeat(MAX_SUGGESTION_LENGTH + 1),
    })
    expect(result).toEqual({ success: false, error: expect.any(String) })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses an anonymous caller', async () => {
    mockAuth.mockResolvedValue({ user: null })
    await expect(suggestEditAction(validCall)).resolves.toEqual({
      success: false,
      error: 'You are not allowed to perform that action.',
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a caller who cannot read the document', async () => {
    mockFindByID.mockRejectedValue(new Error('Forbidden'))
    await expect(suggestEditAction(validCall)).resolves.toEqual({
      success: false,
      error: 'You are not allowed to perform that action.',
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('checks readability as the caller rather than as an admin', async () => {
    await suggestEditAction(validCall)
    expect(mockFindByID).toHaveBeenCalledWith(
      expect.objectContaining({ user: suggester, overrideAccess: false }),
    )
  })

  it('sends to the configured address with the suggester as reply-to', async () => {
    process.env.SHARED_CONTENT_SUGGESTIONS_EMAIL = 'shared@avy-fx.org'

    await expect(suggestEditAction(validCall)).resolves.toEqual({ success: true })

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'shared@avy-fx.org', replyTo: 'admin@nwac.us' }),
    )
  })

  it('carries the suggester, their center and the trimmed text into the email', async () => {
    await suggestEditAction(validCall)

    expect(generateSharedContentSuggestionEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionLabel: 'Shared Media',
        documentTitle: 'shared-image-mountain.png',
        suggesterName: 'NWAC Admin',
        suggesterEmail: 'admin@nwac.us',
        suggesterCenters: 'Northwest Avalanche Center',
        suggestion: 'The credit should name the photographer.',
        adminUrl: expect.stringContaining('/admin/collections/sharedMedia/7'),
      }),
    )
  })

  it('reports a mailer failure rather than claiming success', async () => {
    jest.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP down'))

    const result = await suggestEditAction(validCall)

    expect(result.success).toBe(false)
    expect(mockLogger.error).toHaveBeenCalled()
  })
})
