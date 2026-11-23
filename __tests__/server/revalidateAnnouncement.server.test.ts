const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({ revalidatePath: (path: string) => mockRevalidatePath(path) }))

jest.mock('../../src/utilities/tenancy/resolveTenant', () => ({
  resolveTenant: async () => ({ id: 2, slug: 'nwac' }),
}))

import {
  revalidateAnnouncement,
  revalidateAnnouncementDelete,
} from '@/collections/Announcements/hooks/revalidateAnnouncement'
import type { Announcement } from '@/payload-types'
import type { PayloadRequest } from 'payload'

const doc: Announcement = {
  id: 6,
  tenant: 2,
  title: 'Road closure',
  type: 'banner',
  createdAt: '',
  updatedAt: '',
}

function buildReq(context: Record<string, unknown> = {}): PayloadRequest {
  // @ts-expect-error - partial mock of PayloadRequest; only context and the logger are used
  return { context, payload: { logger: { info: jest.fn() } } }
}

async function save(req: PayloadRequest) {
  // @ts-expect-error - partial hook arguments; the hook only reads doc and req
  await revalidateAnnouncement({ doc, req })
}

async function remove(req: PayloadRequest) {
  // @ts-expect-error - partial hook arguments; the hook only reads doc and req
  await revalidateAnnouncementDelete({ doc, req })
}

describe('revalidateAnnouncement', () => {
  beforeEach(() => {
    mockRevalidatePath.mockReset()
  })

  it("purges the center's announcements route on save", async () => {
    await save(buildReq())

    expect(mockRevalidatePath).toHaveBeenCalledWith('/api/nwac/announcements')
  })

  it("purges the center's announcements route on delete", async () => {
    await remove(buildReq())

    expect(mockRevalidatePath).toHaveBeenCalledWith('/api/nwac/announcements')
  })

  it('does nothing when revalidation is disabled, as the seed does', async () => {
    await save(buildReq({ disableRevalidate: true }))

    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
