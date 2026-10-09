import { authTest, expect } from '../../fixtures/auth.fixture'

const SERVER_URL = 'http://localhost:3000'

authTest.describe.configure({ timeout: 90000 })

const COLUMNS =
  'Title,Subtitle,Provider,Course Type,Start Date,Start Time,A3 Time Zone,End Date,End Time,Registration Deadline Date,Registration Deadline Time,Place Name,Street Address,City,State,ZIP Code,Course URL,Mode of Travel,Interest Groups,Description'

// A subtitle unique to this run, so a re-run never sees the last run's Course as a duplicate
function sheet(subtitle: string): string {
  const row = (title: string, provider: string, courseType: string) =>
    `${title},${subtitle},${provider},${courseType},1/9/2027,8:00 AM,Pacific Time (PT),1/10/2027,4:00 PM,,,Snoqualmie Pass,,Seattle,Washington,,https://example.org/course,"Ski, Splitboard",For BIPOC,`
  return [
    COLUMNS,
    row('Recreational Level 1 – Ski/Splitboard', 'Mountain Education Center', 'Rec 1'),
    row('Professional Level 1 – Ski/Splitboard', 'Mountain Education Center', 'Pro 1'),
  ].join('\n')
}

authTest.describe('Course Import', () => {
  authTest('a Provider Manager previews and imports a sheet', async ({ loginAs }) => {
    const page = await loginAs('providerManager')
    const subtitle = `E2E course import ${Date.now()}`

    await page.goto(`${SERVER_URL}/admin/collections/courses`)
    const titleActions = page.locator('.list-header__title-actions')
    await expect(titleActions.getByRole('link', { name: 'Create New' })).toBeVisible()
    await titleActions.getByRole('link', { name: 'Import courses' }).click()
    await expect(page).toHaveURL(/\/admin\/course-import$/)

    await page.getByLabel('Course spreadsheet (CSV)').setInputFiles({
      name: 'courses.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(sheet(subtitle)),
    })

    await expect(page.getByText('Ready to import · 1')).toBeVisible()
    await expect(page.getByText('Blocked · 1')).toBeVisible()
    await expect(
      page.getByText('Mountain Education Center is not approved to offer Pro 1 courses.'),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Import 1 course' }).click()
    await expect(page.getByRole('status')).toContainText('Imported 1 course.')
    await expect(page.getByRole('region', { name: 'Imported' })).toContainText(
      'Row 2 · Recreational Level 1 – Ski/Splitboard',
    )
    await expect(page.getByRole('region', { name: 'Not imported' })).toContainText(
      'not approved to offer Pro 1 courses',
    )

    const res = await page.request.get(
      `${SERVER_URL}/api/courses?where[subtitle][equals]=${encodeURIComponent(subtitle)}&depth=0`,
    )
    const { docs } = await res.json()
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ _status: 'published', affinityGroups: ['bipoc'] })

    await page.request.delete(`${SERVER_URL}/api/courses/${docs[0].id}`)
    await page.context().close()
  })

  authTest('a Provider User cannot reach the import', async ({ loginAs }) => {
    const page = await loginAs('providerUser')

    await page.goto(`${SERVER_URL}/admin/collections/courses`)
    await expect(page.locator('.list-header')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Import courses' })).toHaveCount(0)

    await page.goto(`${SERVER_URL}/admin/course-import`)
    await expect(page.getByText('Only Provider Managers can run a Course Import.')).toBeVisible()
    await expect(page.getByLabel('Course spreadsheet (CSV)')).toHaveCount(0)
    await page.context().close()
  })
})
