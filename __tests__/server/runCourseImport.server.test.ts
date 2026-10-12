import type { CourseImportPlan, PlannedCourse } from '@/services/courseImport/planCourseImport'
import {
  coursesToCreate,
  createAllOrNone,
  planFromCsvText,
} from '@/services/courseImport/runCourseImport'

const planned = (row: number): PlannedCourse => ({
  row,
  provider: 'Snowbird Mountain Guides',
  title: `Course ${row}`,
  start: '1/21/2027 8:00 AM',
  // @ts-expect-error -- the helpers only pass data through
  data: { title: `Course ${row}` },
})

describe('coursesToCreate', () => {
  const plan: CourseImportPlan = {
    fileErrors: [],
    ready: [planned(2), planned(5)],
    blocked: [],
    likelyDuplicates: [planned(3), planned(4)],
  }

  it('takes the ready rows plus only the ticked duplicates, in sheet order', () => {
    expect(coursesToCreate(plan, [4]).map((c) => c.row)).toEqual([2, 4, 5])
  })
})

describe('createAllOrNone', () => {
  it('removes what it already created when a later Course fails', async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce(10)
      .mockRejectedValueOnce(new Error('Slug already taken'))
    const remove = jest.fn()
    const result = await createAllOrNone({
      courses: [planned(2), planned(3), planned(4)],
      create,
      remove,
    })
    expect(result).toEqual({ ok: false, row: 3, message: 'Slug already taken' })
    expect(remove).toHaveBeenCalledWith([10])
    expect(create).toHaveBeenCalledTimes(2)
  })
})

describe('planFromCsvText', () => {
  const plan = (text: string) => planFromCsvText({ text, providers: [], existingCourses: [] })

  it('lists every unreadable row at once, in sheet order', () => {
    const result = plan('Title,Provider\nA,B,extra\nC\nD,E')
    expect(result.ok && result.plan.fileErrors).toEqual([
      'Row 2: Too many fields: expected 2 fields but parsed 3',
      'Row 3: Too few fields: expected 2 fields but parsed 1',
    ])
  })

  it('tells an Excel upload to export as CSV', () => {
    const result = plan('PK\u0003\u0004binary')
    expect(result.ok && result.plan.fileErrors).toEqual([
      'This looks like an Excel file. Export it as CSV and upload that instead.',
    ])
  })
})
