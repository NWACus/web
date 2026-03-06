import { buildTenant } from '../builders'

// Mock provisionTenant before importing the hook.
// Use relative path because jest.mock doesn't resolve @/ aliases.
jest.mock('../../src/collections/Tenants/endpoints/provisionTenant', () => ({
  provision: jest.fn(),
}))

import { provision } from '@/collections/Tenants/endpoints/provisionTenant'
import { provisionAfterChange } from '@/collections/Tenants/hooks/provisionAfterChange'

const mockProvision = jest.mocked(provision)

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}

const mockPayload = {
  logger: mockLogger,
}

function buildHookArgs(overrides: Record<string, unknown> = {}) {
  const doc = buildTenant({ id: 1, name: 'Test AC', slug: 'tac' })
  return {
    doc,
    operation: 'create' as const,
    context: {},
    req: { payload: mockPayload },
    collection: { slug: 'tenants' },
    previousDoc: doc,
    ...overrides,
  }
}

describe('provisionAfterChange', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls provision on create operation', async () => {
    const args = buildHookArgs()

    // @ts-expect-error - partial mock of hook args
    await provisionAfterChange(args)

    expect(mockProvision).toHaveBeenCalledWith(mockPayload, args.doc)
    expect(mockLogger.info).toHaveBeenCalledWith('Auto-provisioning new tenant: Test AC (tac)')
  })

  it('skips provisioning on update operation', async () => {
    const args = buildHookArgs({ operation: 'update' })

    // @ts-expect-error - partial mock of hook args
    const result = await provisionAfterChange(args)

    expect(mockProvision).not.toHaveBeenCalled()
    expect(result).toEqual(args.doc)
  })

  it('skips provisioning when skipProvision context is set', async () => {
    const args = buildHookArgs({ context: { skipProvision: true } })

    // @ts-expect-error - partial mock of hook args
    const result = await provisionAfterChange(args)

    expect(mockProvision).not.toHaveBeenCalled()
    expect(result).toEqual(args.doc)
  })

  it('returns the doc after provisioning', async () => {
    const args = buildHookArgs()

    // @ts-expect-error - partial mock of hook args
    const result = await provisionAfterChange(args)

    expect(result).toEqual(args.doc)
  })
})
