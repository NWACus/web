import { healColumnLayout } from '@/blocks/Content/hooks/healColumnLayout'

// Minimal mock for FieldHook args
const createArgs = (overrides: Record<string, unknown>) =>
  ({
    collection: {} as never,
    context: {},
    data: {},
    field: {} as never,
    global: null,
    indexPath: [],
    operation: 'update',
    originalDoc: {},
    overrideAccess: false,
    path: [],
    previousSiblingDoc: {},
    previousValue: undefined,
    req: {} as never,
    schemaPath: [],
    siblingData: {},
    siblingDocWithLocales: {},
    siblingFields: [],
    value: null,
    blockData: undefined,
    ...overrides,
  }) as Parameters<typeof healColumnLayout>[0]

describe('healColumnLayout', () => {
  it('passes through valid layout values', () => {
    const result = healColumnLayout(
      createArgs({ value: '2_11', siblingData: { columns: [{}, {}] } }),
    )
    expect(result).toBe('2_11')
  })

  it('heals null to default layout', () => {
    const result = healColumnLayout(createArgs({ value: null, siblingData: {} }))
    expect(result).toBe('1_1')
  })

  it('heals undefined to default layout', () => {
    const result = healColumnLayout(createArgs({ value: undefined, siblingData: {} }))
    expect(result).toBe('1_1')
  })

  it('heals null to match current column count of 2', () => {
    const result = healColumnLayout(createArgs({ value: null, siblingData: { columns: [{}, {}] } }))
    expect(result).toBe('2_11')
  })

  it('heals null to match current column count of 3', () => {
    const result = healColumnLayout(
      createArgs({ value: null, siblingData: { columns: [{}, {}, {}] } }),
    )
    expect(result).toBe('3_111')
  })

  it('heals null to match current column count of 4', () => {
    const result = healColumnLayout(
      createArgs({ value: null, siblingData: { columns: [{}, {}, {}, {}] } }),
    )
    expect(result).toBe('4_1111')
  })

  it('heals invalid string value to default', () => {
    const result = healColumnLayout(createArgs({ value: 'invalid', siblingData: {} }))
    expect(result).toBe('1_1')
  })

  it('heals numeric value to default', () => {
    const result = healColumnLayout(createArgs({ value: 42, siblingData: {} }))
    expect(result).toBe('1_1')
  })

  it('passes through all valid layout values', () => {
    const validLayouts = [
      '1_1',
      '2_11',
      '2_12',
      '2_21',
      '3_111',
      '3_112',
      '3_121',
      '3_211',
      '4_1111',
    ]
    for (const layout of validLayouts) {
      const colCount = parseInt(layout.split('_')[0])
      const columns = Array.from({ length: colCount }, () => ({}))
      const result = healColumnLayout(createArgs({ value: layout, siblingData: { columns } }))
      expect(result).toBe(layout)
    }
  })
})
