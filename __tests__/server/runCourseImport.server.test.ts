import type { Course } from '@/payload-types'
import type { CourseImportPlan, PlannedCourse } from '@/services/courseImport/planCourseImport'
import {
  coursesToCreate,
  courseToImportData,
  createAllOrNone,
  importablePlan,
  importSummary,
  planFromCsvText,
  type PreviewResult,
} from '@/services/courseImport/runCourseImport'

const planned = (row: number): PlannedCourse => ({
  row,
  provider: 'Snowbird Mountain Guides',
  title: `Course ${row}`,
  start: '1/21/2027 8:00 AM',
  // @ts-expect-error -- the helpers only pass data through
  data: { title: `Course ${row}` },
})

describe('courseToImportData', () => {
  it('fills optional fields the same way an imported row does', () => {
    // @ts-expect-error -- only the fields the conversion reads
    const course: Course = {
      title: 'Avalanche Rescue – Ski',
      provider: 6,
      courseType: 'rescue',
      startDate: '2026-12-20T16:00:00.000Z',
      startDate_tz: 'America/Los_Angeles',
      endDate_tz: 'America/Los_Angeles',
      registrationDeadline_tz: 'America/Los_Angeles',
      location: { placeName: 'Mt. Hood', state: 'OR' },
    }
    expect(courseToImportData(course)).toEqual({
      title: 'Avalanche Rescue – Ski',
      subtitle: '',
      description: '',
      provider: 6,
      courseType: 'rescue',
      startDate: '2026-12-20T16:00:00.000Z',
      startDate_tz: 'America/Los_Angeles',
      endDate: '',
      endDate_tz: 'America/Los_Angeles',
      registrationDeadline: null,
      registrationDeadline_tz: 'America/Los_Angeles',
      location: { placeName: 'Mt. Hood', address: '', city: '', state: 'OR', zip: '' },
      courseUrl: '',
      modeOfTravel: [],
      affinityGroups: [],
    })
  })
})

describe('planFromCsvText', () => {
  const plan = (text: unknown) => planFromCsvText({ text, providers: [], existingCourses: [] })

  it('asks for a file when nothing was uploaded', () => {
    expect(plan('  ')).toEqual({ ok: false, error: 'Choose a CSV file.' })
    expect(plan(undefined)).toEqual({ ok: false, error: 'Choose a CSV file.' })
  })

  it('refuses a file that is too large', () => {
    expect(plan('x'.repeat(5_000_001))).toEqual({ ok: false, error: 'That file is too large.' })
  })

  it('refuses more rows than one import takes', () => {
    const text = ['Title', ...Array.from({ length: 2001 }, (_, i) => `Course ${i}`)].join('\n')
    expect(plan(text)).toEqual({ ok: false, error: 'A Course Import takes at most 2000 rows.' })
  })

  it('plans a readable file, reporting column problems in the plan', () => {
    const result = plan('Title\nCourse')
    expect(result.ok && result.plan.fileErrors[0]).toMatch(/^Missing columns:/)
  })
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

  it('ignores a malformed list of ticked rows', () => {
    expect(coursesToCreate(plan, 'all').map((c) => c.row)).toEqual([2, 5])
  })
})

describe('createAllOrNone', () => {
  it('creates every Course in order', async () => {
    const create = jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(11)
    const remove = jest.fn()
    const result = await createAllOrNone({ courses: [planned(2), planned(3)], create, remove })
    expect(result).toEqual({ ok: true, createdIds: [10, 11] })
    expect(remove).not.toHaveBeenCalled()
  })

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

  it('removes nothing when the first Course fails', async () => {
    const remove = jest.fn()
    await createAllOrNone({
      courses: [planned(2)],
      create: jest.fn().mockRejectedValue(new Error('nope')),
      remove,
    })
    expect(remove).not.toHaveBeenCalled()
  })
})

describe('importablePlan', () => {
  it('stops the whole import when the file itself has problems', () => {
    const preview: PreviewResult = {
      ok: true,
      plan: {
        fileErrors: ['Missing columns: End Time.'],
        ready: [],
        blocked: [],
        likelyDuplicates: [],
      },
    }
    expect(importablePlan(preview)).toEqual({ ok: false, error: 'Missing columns: End Time.' })
  })

  it('passes a readable plan and an earlier error through', () => {
    const plan = { fileErrors: [], ready: [], blocked: [], likelyDuplicates: [] }
    expect(importablePlan({ ok: true, plan })).toEqual({ ok: true, plan })
    expect(importablePlan({ ok: false, error: 'Choose a CSV file.' })).toEqual({
      ok: false,
      error: 'Choose a CSV file.',
    })
  })
})

describe('importSummary', () => {
  it('lists the created rows, the duplicates left out, and the blocked rows', () => {
    const blocked = [{ row: 6, provider: 'X', title: 'T', start: 'S', reasons: ['Nope.'] }]
    const plan: CourseImportPlan = {
      fileErrors: [],
      ready: [planned(2)],
      blocked,
      likelyDuplicates: [planned(3), planned(4)],
    }
    const summary = importSummary(plan, [planned(2), planned(4)])
    expect(summary.created.map((r) => r.row)).toEqual([2, 4])
    expect(summary.skipped.map((r) => r.row)).toEqual([3])
    expect(summary.blocked).toBe(blocked)
    expect(summary.created[0]).not.toHaveProperty('data')
  })
})
