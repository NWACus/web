import { readFileSync } from 'fs'
import path from 'path'

import { parseCourseCsv } from '@/services/courseImport/parseCourseCsv'
import {
  COURSE_IMPORT_COLUMNS,
  type CatalogProvider,
  type CourseImportData,
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

const existingKafRescue: CourseImportData = {
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

describe('parseCourseCsv', () => {
  it('keeps a multi-line quoted description in one row', () => {
    const { rows, errors } = parseCourseCsv(csv)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(17)
    expect(rows[16].Description).toBe('Line one, with a comma.\n\nLine two "quoted".')
  })

  it('reads a tab-separated copy of the sheet the same way', () => {
    const tsv = [COURSE_IMPORT_COLUMNS.join('\t'), COURSE_IMPORT_COLUMNS.map(() => 'x').join('\t')]
    expect(parseCourseCsv(tsv.join('\n')).headers).toEqual([...COURSE_IMPORT_COLUMNS])
  })

  it('ignores a leading byte-order mark', () => {
    const withBom = String.fromCharCode(0xfeff) + COURSE_IMPORT_COLUMNS.join(',')
    expect(parseCourseCsv(withBom).headers[0]).toBe('Title')
  })
})

describe('planCourseImport', () => {
  it('sorts every row into exactly one group', () => {
    const plan = planFixture()
    expect(plan.fileErrors).toEqual([])
    expect(plan.ready.map((r) => r.row)).toEqual([2, 3, 4, 9, 18])
    expect(plan.likelyDuplicates.map((r) => r.row)).toEqual([15, 16])
    expect(plan.blocked.map((r) => r.row)).toEqual([5, 6, 7, 8, 10, 11, 12, 13, 14, 17])
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

  it('treats rows that differ only by subtitle as two Courses', () => {
    const [first, second] = planFixture().ready
    expect(first.data.subtitle).not.toBe(second.data.subtitle)
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

  it('blocks a combined-course title typed as Rec 1', () => {
    expect(blockedReasons(7)).toEqual([
      'Title starts with "Recreational Level 1 & Avalanche Rescue", but Course Type Rec 1 titles start with "Recreational Level 1".',
    ])
  })

  it('blocks a Mode of Travel the catalog does not have', () => {
    expect(blockedReasons(8)).toEqual([
      'Mode of Travel "Ice/Alpine Climb" is not one of: Ski, Splitboard, Motorized, Snowshoe.',
    ])
  })

  it('accepts the For BIPOC Affinity Group', () => {
    expect(planFixture().ready.find((r) => r.row === 9)?.data.affinityGroups).toEqual([
      'lgbtq',
      'women',
      'bipoc',
    ])
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

  it('flags a row matching an existing Course on every field as a likely duplicate', () => {
    expect(planFixture().likelyDuplicates[0].data.provider).toBe(6)
  })

  it('flags a repeat of an earlier row in the same file', () => {
    const plan = planFixture()
    expect(plan.likelyDuplicates[1].data).toEqual(plan.ready[1].data)
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

  it('reports a sheet row number that matches the spreadsheet', () => {
    expect(planFixture().blocked[0]).toMatchObject({
      row: 5,
      provider: 'Jackson Hole Mountain Guides - Jackson, WY Branch',
      title: 'Recreational Level 1 – Ski/Splitboard',
      start: '1/21/2027 8:00 AM',
    })
  })
})
