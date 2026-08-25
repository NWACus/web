// Focused states for the MWF storage-boundary guards not already covered by
// the workflow integration suite: creation constraints, the archive-import
// bypass, invalid corrections, and terminal withdrawn rows.
import {
  enforceWorkflowInvariants,
  guardDelete,
} from '@/collections/MwfForecasts/hooks/workflowGuards'

const parent = {
  id: 10,
  tenant: 7,
  status: 'published',
  issuance: 'afternoon',
  serviceDate: '2026-08-24',
  revision: 3,
}

function req(doc: unknown = parent) {
  return { payload: { findByID: jest.fn().mockResolvedValue(doc) } }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
const run = (args: Record<string, unknown>) => enforceWorkflowInvariants(args as any)

describe('create', () => {
  it('new forecasts must start as drafts', async () => {
    await expect(
      run({ operation: 'create', data: { status: 'published' }, req: req(), context: {} }),
    ).rejects.toThrow(/start as drafts/)
  })

  it('the archive importer may insert published rows via context.mwfImport', async () => {
    const data = { status: 'published', issuance: 'morning', serviceDate: '2026-01-05' }
    await expect(
      run({ operation: 'create', data, req: req(), context: { mwfImport: true } }),
    ).resolves.toMatchObject({ status: 'published' })
  })

  it('a correction inherits slot, date, and revision from its parent', async () => {
    const data = {
      status: 'draft',
      supersedes: parent.id,
      tenant: 7,
      issuance: 'morning',
      serviceDate: '2026-08-25',
      revision: 1,
    }
    const out = await run({ operation: 'create', data, req: req(), context: {} })
    expect(out).toMatchObject({
      issuance: 'afternoon',
      serviceDate: '2026-08-24',
      revision: 4,
    })
  })

  it('a correction of an unpublished parent is rejected', async () => {
    await expect(
      run({
        operation: 'create',
        data: { status: 'draft', supersedes: 10 },
        req: req({ ...parent, status: 'draft' }),
        context: {},
      }),
    ).rejects.toThrow(/must supersede a published forecast/)
  })

  it('a cross-tenant correction is rejected', async () => {
    await expect(
      run({
        operation: 'create',
        data: { status: 'draft', supersedes: 10, tenant: 8 },
        req: req(),
        context: {},
      }),
    ).rejects.toThrow(/same center/)
  })
})

describe('update', () => {
  it('withdrawn rows are terminal — even for the workflow', async () => {
    await expect(
      run({
        operation: 'update',
        data: { body: {} },
        originalDoc: { status: 'withdrawn' },
        req: req(),
        context: { mwfWorkflow: true },
      }),
    ).rejects.toThrow(/immutable/)
  })

  it('the workflow context may flip published → withdrawn', async () => {
    await expect(
      run({
        operation: 'update',
        data: { status: 'withdrawn', withdrawnAt: '2026-08-25T16:00:00.000Z' },
        originalDoc: { status: 'published' },
        req: req(),
        context: { mwfWorkflow: true },
      }),
    ).resolves.toMatchObject({ status: 'withdrawn' })
  })

  it('a correction draft stays pinned across autosaves', async () => {
    const out = await run({
      operation: 'update',
      data: { issuance: 'morning', serviceDate: '2026-08-26' },
      originalDoc: { status: 'draft', supersedes: parent.id },
      req: req(),
      context: {},
    })
    expect(out).toMatchObject({ issuance: 'afternoon', serviceDate: '2026-08-24', revision: 4 })
  })
})

describe('delete', () => {
  it('missing rows pass through (Payload 404s them downstream)', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
      guardDelete({ id: 99, req: req(null) } as any),
    ).resolves.toBeUndefined()
  })

  it('withdrawn rows cannot be hard-deleted either', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
      guardDelete({ id: 10, req: req({ ...parent, status: 'withdrawn' }) } as any),
    ).rejects.toThrow(/only drafts/i)
  })
})
