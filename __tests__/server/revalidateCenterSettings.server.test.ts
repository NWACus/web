import {
  revalidateSettingsReferencing,
  revalidateTenantSettings,
} from '@/utilities/revalidateCenterSettings'

const mockFind = jest.fn()
const mockFindByID = jest.fn()
const mockRevalidateTag = jest.fn()

jest.mock('next/cache', () => ({ revalidateTag: (tag: string) => mockRevalidateTag(tag) }))

jest.mock('payload', () => ({
  getPayload: () =>
    Promise.resolve({
      find: mockFind,
      findByID: mockFindByID,
      logger: { error: jest.fn(), warn: jest.fn() },
    }),
}))

jest.mock('../../src/payload.config', () => ({ __esModule: true, default: {} }))

describe('utilities: revalidateCenterSettings', () => {
  beforeEach(() => {
    mockFind.mockReset()
    mockFindByID.mockReset()
    mockRevalidateTag.mockReset()
  })

  it('clears every center whose settings use the document', async () => {
    mockFind.mockResolvedValue({
      docs: [{ tenant: { id: 1, slug: 'nwac' } }, { tenant: { id: 2, slug: 'sac' } }],
    })

    await revalidateSettingsReferencing('media', 7)

    expect(mockFind.mock.calls[0][0].where.or).toContainEqual({ banner: { equals: 7 } })
    expect(mockRevalidateTag.mock.calls).toEqual([['settings-nwac'], ['settings-sac']])
  })

  it('skips the query for collections settings never reference', async () => {
    await revalidateSettingsReferencing('biographies', 7)

    expect(mockFind).not.toHaveBeenCalled()
  })

  it('does not fail the save when the lookup fails', async () => {
    mockFind.mockRejectedValue(new Error('connection lost'))

    await expect(revalidateSettingsReferencing('pages', 7)).resolves.toBeUndefined()
  })

  it('clears the tenant of a deleted document', async () => {
    mockFindByID.mockResolvedValue({ id: 1, slug: 'nwac' })

    await revalidateTenantSettings(1)

    expect(mockRevalidateTag).toHaveBeenCalledWith('settings-nwac')
  })

  it('does not fail the delete when the tenant is gone', async () => {
    mockFindByID.mockRejectedValue(new Error('not found'))

    await expect(revalidateTenantSettings(1)).resolves.toBeUndefined()
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })
})
