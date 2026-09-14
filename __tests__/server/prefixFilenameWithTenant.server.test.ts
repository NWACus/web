const mockResolveTenant = jest.fn()
jest.mock('../../src/utilities/tenancy/resolveTenant', () => ({
  resolveTenant: (...args: unknown[]) => mockResolveTenant(...args),
}))

import { prefixFilenameWithTenant } from '@/collections/Media/hooks/prefixFilenameWithTenant'

type HookArgs = Parameters<typeof prefixFilenameWithTenant>[0]

type UploadedFile = {
  clientUploadContext?: unknown
  data: Buffer
  mimetype: string
  name: string
  size: number
}

function buildFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
  return {
    data: Buffer.from('png-bytes'),
    mimetype: 'image/png',
    name: 'photo.png',
    size: 9,
    ...overrides,
  }
}

/**
 * The hook only reads `args.data`, `operation` and `req.file`, so the mock
 * covers just that surface instead of a full PayloadRequest.
 */
async function runHook({
  data,
  file,
  operation = 'create',
}: {
  data?: Record<string, unknown>
  file?: UploadedFile
  operation?: HookArgs['operation']
}) {
  // @ts-expect-error intentionally partial hook args, see comment above
  await prefixFilenameWithTenant({ args: { data }, operation, req: { file } })
}

beforeEach(() => {
  mockResolveTenant.mockReset()
  mockResolveTenant.mockImplementation((tenant: number | { id: number; slug: string }) =>
    Promise.resolve(typeof tenant === 'number' ? { id: tenant, slug: 'snfac' } : tenant),
  )
})

describe('prefixFilenameWithTenant', () => {
  it('prefixes the filename with the tenant slug for server-side uploads', async () => {
    const file = buildFile()

    await runHook({ data: { tenant: 4 }, file })

    expect(mockResolveTenant).toHaveBeenCalledWith(4)
    expect(file.name).toBe('snfac-photo.png')
    expect(file).not.toHaveProperty('clientUploadContext')
  })

  it('drops clientUploadContext after renaming a client-uploaded file so the plugin re-uploads it under the new name', async () => {
    // Since Payload 3.82 the cloud-storage plugin skips files that still carry
    // clientUploadContext; keeping it would leave the renamed doc pointing at a
    // blob that was never written.
    const file = buildFile({ clientUploadContext: { prefix: 'local' } })

    await runHook({ data: { tenant: { id: 4, slug: 'snfac' } }, file })

    expect(file.name).toBe('snfac-photo.png')
    expect(file).not.toHaveProperty('clientUploadContext')
  })

  it('leaves the file untouched when the document has no tenant', async () => {
    const file = buildFile({ clientUploadContext: { prefix: 'local' } })

    await runHook({ data: { alt: 'no tenant' }, file })

    expect(mockResolveTenant).not.toHaveBeenCalled()
    expect(file.name).toBe('photo.png')
    expect(file.clientUploadContext).toEqual({ prefix: 'local' })
  })

  it('does nothing for operations without a file or outside create/update', async () => {
    const file = buildFile({ clientUploadContext: { prefix: 'local' } })

    await runHook({ data: { tenant: 4 }, file: undefined })
    await runHook({ data: { tenant: 4 }, file, operation: 'read' })

    expect(mockResolveTenant).not.toHaveBeenCalled()
    expect(file.name).toBe('photo.png')
    expect(file.clientUploadContext).toEqual({ prefix: 'local' })
  })
})
