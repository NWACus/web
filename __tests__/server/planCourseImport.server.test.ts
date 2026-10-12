import { readFileSync } from 'fs'
import path from 'path'

import { parseCourseCsv } from '@/services/courseImport/parseCourseCsv'
import {
  COURSE_IMPORT_COLUMNS,
  type CatalogProvider,
  type ExistingCourse,
  planCourseImport,
} from '@/services/courseImport/planCourseImport'

const providers: CatalogProvider[] = [
  { id: 1, name: 'Snowbird Mountain Guides', courseTypes: ['rec-1', 'rec-2', 'rescue'] },
  { id: 2, name: 'American Alpine Institute', courseTypes: ['rec-1', 'level-1-rescue-combined'] },
  { id: 3, name: 'VNTRbirds LLC', courseTypes: ['rec-1'] },
  { id: 4, name: 'Synnott Mountain Guides', courseTypes: ['rec-1'] },
  { id: 5, name: 'Powder Pro Lab', courseTypes: ['rec-1', 'rescue'] },
  { id: 6, name: 'Kaf Adventures', courseTypes: ['rec-1', 'rescue'] },
]

const existingKafRescue: ExistingCourse = {
  id: 99,
  title: 'Avalanche Rescue – Ski/Splitboard/Snowshoe',
  subtitle: 'Lift Access Course Taught with AIARE Curriculum – Hybrid (remote classwork)',
  description: '',
  provider: 6,
  courseType: 'rescue',
  startDate: '2026-12-20T16:00:00.000Z',
  startDate_tz: 'America/Los_Angeles',
  endDate: '2026-12-21T00:00:00.000Z',
  endDate_tz: 'America/Los_Angeles',
  registrationDeadline: null,
  registrationDeadline_tz: 'America/Los_Angeles',
  location: { placeName: 'Mt. Hood', address: '', city: '', state: 'OR', zip: '' },
  courseUrl: '',
  modeOfTravel: ['snowshoe', 'ski', 'splitboard'],
  affinityGroups: [],
}

const csv = readFileSync(path.join(__dirname, 'fixtures/courseImport.csv'), 'utf8')

function planFixture() {
  const { headers, rows } = parseCourseCsv(csv)
  return planCourseImport({ headers, rows, providers, existingCourses: [existingKafRescue] })
}

const blockedReasons = (row: number) => planFixture().blocked.find((b) => b.row === row)?.reasons

describe('planCourseImport', () => {
  it('sorts every row into exactly one group', () => {
    const plan = planFixture()
    expect(plan.fileErrors).toEqual([])
    expect(plan.ready.map((r) => r.row)).toEqual([2, 4, 7, 9, 18])
    expect(plan.likelyDuplicates.map((r) => r.row)).toEqual([3, 15, 16])
    expect(plan.blocked.map((r) => r.row)).toEqual([5, 6, 8, 10, 11, 12, 13, 14, 17])
  })

  it('builds the Course data for a clean row, in the row time zone', () => {
    const course = planFixture().ready[0].data
    expect(course).toEqual({
      title: 'Recreational Level 1 – Ski/Splitboard',
      subtitle: 'Lift Access Course Taught with AIARE Curriculum – Hybrid (remote classwork)',
      description: 'Lift-Accessed',
      provider: 1,
      courseType: 'rec-1',
      startDate: '2027-01-21T15:00:00.000Z',
      startDate_tz: 'America/Denver',
      endDate: '2027-01-24T23:00:00.000Z',
      endDate_tz: 'America/Denver',
      registrationDeadline: null,
      registrationDeadline_tz: 'America/Denver',
      location: {
        placeName: 'Snowbird, Little Cottonwood Canyon',
        address: '',
        city: 'Salt Lake City',
        state: 'UT',
        zip: '',
      },
      courseUrl: 'https://www.snowbird.com/guiding-lessons/programs/aiare-1/',
      modeOfTravel: ['ski', 'splitboard'],
      affinityGroups: [],
    })
  })

  it('matches a Provider ignoring case and runs of whitespace', () => {
    expect(planFixture().ready.find((r) => r.row === 4)?.data.provider).toBe(1)
  })

  it('blocks an unknown Provider instead of creating one', () => {
    expect(blockedReasons(5)).toEqual([
      'Provider "Jackson Hole Mountain Guides - Jackson, WY Branch" not found.',
    ])
  })

  it('blocks a Course Type the Provider is not approved for', () => {
    expect(blockedReasons(6)).toEqual([
      'Snowbird Mountain Guides is not approved to offer Pro 1 courses.',
    ])
  })

  it('accepts a Rec 1 whose title also names Avalanche Rescue', () => {
    expect(planFixture().ready.find((r) => r.row === 7)?.data).toMatchObject({
      title: 'Recreational Level 1 & Avalanche Rescue – Ski',
      courseType: 'rec-1',
    })
  })

  it('blocks a title that names a different Course Type', () => {
    const { headers, rows } = parseCourseCsv(csv)
    const row = { ...rows[0], Title: 'Recreational Level 2 – Ski/Splitboard' }
    const plan = planCourseImport({ headers, rows: [row], providers, existingCourses: [] })
    expect(plan.blocked[0].reasons).toEqual([
      'Title starts with "Recreational Level 2", but Course Type Rec 1 titles start with "Recreational Level 1" or "Recreational Level 1 & Avalanche Rescue".',
    ])
  })

  it('blocks a Mode of Travel the catalog does not have', () => {
    expect(blockedReasons(8)).toEqual([
      'Mode of Travel "Ice/Alpine Climb" is not one of: Ski, Splitboard, Motorized, Snowshoe.',
    ])
  })

  it('allows a row with no Mode of Travel, which is optional on a Course', () => {
    const { headers, rows } = parseCourseCsv(csv)
    const row = { ...rows[0], 'Mode of Travel': '' }
    const plan = planCourseImport({ headers, rows: [row], providers, existingCourses: [] })
    expect(plan.blocked).toEqual([])
    expect(plan.ready[0].data.modeOfTravel).toEqual([])
  })

  it('imports an international course in Japan Time, stored in UTC', () => {
    const { headers } = parseCourseCsv(csv)
    const japanRow = {
      ...parseCourseCsv(csv).rows[8],
      'A3 Time Zone': 'Japan Time (JST)',
      'Start Date': '1/17/2027',
      'End Date': '1/19/2027',
    }
    const plan = planCourseImport({ headers, rows: [japanRow], providers, existingCourses: [] })
    expect(plan.blocked).toEqual([])
    expect(plan.ready[0].data).toMatchObject({
      startDate: '2027-01-16T23:00:00.000Z',
      startDate_tz: 'Asia/Tokyo',
      location: { state: 'INTL', placeName: 'Otaru' },
    })
  })

  it('blocks a row with no time zone', () => {
    expect(blockedReasons(10)).toEqual(['A3 Time Zone is required.'])
  })

  it('blocks a row with no End Time', () => {
    expect(blockedReasons(11)).toEqual(['End Time "" must look like 8:00 AM.'])
  })

  it('blocks a row whose end is not after its start', () => {
    expect(blockedReasons(12)).toEqual(['End must be after Start.'])
  })

  it('blocks a markdown Course URL', () => {
    expect(blockedReasons(13)).toEqual([
      'Course URL "[www.powderprolab.com](https://www.powderprolab.com)" must be a full http:// or https:// link.',
    ])
  })

  it('blocks a registration deadline after the start', () => {
    expect(blockedReasons(14)).toEqual(['Registration Deadline must be before Start.'])
  })

  it('flags a row matching an existing Course even when its title and description differ', () => {
    const { headers, rows } = parseCourseCsv(csv)
    const reworded = {
      ...existingKafRescue,
      title: 'AIARE Avalanche Rescue',
      description: 'Older wording.',
      courseUrl: 'https://example.org/old',
    }
    const plan = planCourseImport({ headers, rows, providers, existingCourses: [reworded] })
    expect(plan.likelyDuplicates.find((r) => r.row === 15)?.matches).toEqual({
      kind: 'course',
      id: 99,
      title: 'AIARE Avalanche Rescue',
      startDate: existingKafRescue.startDate,
      timeZone: 'America/Los_Angeles',
    })
  })

  it('flags a later row with the same Provider, Course Type, times and place as an earlier one', () => {
    const plan = planFixture()
    const row3 = plan.likelyDuplicates.find((r) => r.row === 3)
    expect(row3?.data.subtitle).not.toBe(plan.ready[0].data.subtitle)
    expect(row3?.matches).toEqual({ kind: 'row', row: 2 })
  })

  it('lists every problem with a row at once', () => {
    expect(blockedReasons(17)).toEqual([
      'Provider "Nobody Guides" not found.',
      'Course Type "Rec 9" is not one of the catalog\'s Course Types.',
      'A3 Time Zone "Hawaii" is not one of the catalog\'s time zones.',
      'State "Utha" is not a state name or "International".',
      'ZIP Code "8411" must be 5 digits or 5+4 format.',
    ])
  })

  it('refuses the whole file when columns are missing or unexpected', () => {
    const headers = [...COURSE_IMPORT_COLUMNS.filter((c) => c !== 'End Time'), 'Price']
    const plan = planCourseImport({ headers, rows: [{}], providers, existingCourses: [] })
    expect(plan.fileErrors).toEqual(['Missing columns: End Time.', 'Unexpected columns: Price.'])
    expect(plan.blocked).toEqual([])
  })
})
