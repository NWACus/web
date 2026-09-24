import { expect, test } from './fixture'
import { loadPage, stubMapbox, tenant } from './helpers'

/**
 * Inventory row S1 — the native weather station map, and its rollout flag.
 *
 * Every tenant but dvac is seeded native for the station map (sac is the one whose alternate-zones
 * KML the mocks serve) and dvac stays on the widget; both states are read, never written. The map
 * itself is a Mapbox canvas — what a browser can assert on is everything around it: the toolbar,
 * and the station list the map publishes as text for readers who can't see the canvas, which is
 * fed by the same data the markers are.
 */

const PHONE = { width: 375, height: 812 }

test.describe('Native vs widget station map', () => {
  test('a widget tenant renders the embedded stations widget', async ({ page }) => {
    const errors = await loadPage(page, `${tenant('dvac')}/weather/stations/map`)

    await expect(page.locator('#widget-container[data-widget="stations"]')).toBeVisible()
    await expect(page.getByTestId('station-map')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('a native tenant renders the map with the stations SnowObs returned', async ({ page }) => {
    await stubMapbox(page)
    const errors = await loadPage(page, `${tenant('sac')}/weather/stations/map`)

    await expect(page.getByTestId('station-map')).toBeVisible()
    await expect(page.locator('#widget-container')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Station Labels' })).toBeVisible()

    // The accessible list carries every station the endpoint mapped, whether or not the canvas
    // could draw; a fixture station outside every zone still lists.
    const list = page.getByRole('list').filter({ hasText: 'White Chuck Mountain' })
    await expect(list).toBeAttached()
    await expect(list).toContainText('Green Lake')
    // The fixture's fourth station has no coordinates and must not be listed.
    await expect(list).not.toContainText('No Coordinates')

    // Mapbox stamps role="img" / aria-label="Map marker" on every element it is handed as a
    // marker, so MapMarker hands it one that is already hidden: the list above is how this
    // content reaches a reader who can't see the canvas, not a few hundred nameless graphics.
    await expect(page.locator('.mapboxgl-marker').first()).toBeAttached()
    await expect(page.getByRole('img', { name: 'Map marker' })).toHaveCount(0)

    // SAC groups stations by its own KML zones rather than its single forecast zone: the filter
    // lists the KML's placemarks and Other, as the widget does.
    // Role locators skip the hidden drawer's copy of each option; label locators would find both.
    await page.getByRole('button', { name: 'Zone' }).click()
    await expect(page.getByRole('checkbox', { name: 'Sierra Crest North' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Carson Range' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Other' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Central Sierra Nevada' })).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('at phone width the filters collapse behind one button', async ({ page }) => {
    await stubMapbox(page)
    await page.setViewportSize(PHONE)
    await loadPage(page, `${tenant('sac')}/weather/stations/map`)

    await expect(page.getByRole('button', { name: 'Open filters' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Station Labels' })).toBeHidden()

    // Nothing pushes the page wider than the phone.
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(PHONE.width)
  })
})

/**
 * The widget's table view (`#/station-table`), rebuilt as `?view=table`: every visible station's
 * current readings, grouped by zone. The fixture's stations all sit outside SAC's KML zones, so
 * they group under Other; their readings are weeks older than SAC's three-hour `within`.
 */
test.describe('Station map table view', () => {
  const tablePage = `${tenant('sac')}/weather/stations/map?view=table`

  /** The station names down the table, top to bottom — assert with `toHaveText`, which waits. */
  function stationNames(page: Parameters<typeof loadPage>[0]) {
    return page.getByTestId('station-table').locator('tr[id^="station-table-"] th[scope="row"]')
  }

  test('lists every station under its zone, without loading the map', async ({ page }) => {
    let mapboxRequests = 0
    await page.route('**/api.mapbox.com/**', (route) => {
      mapboxRequests += 1
      return route.abort()
    })
    const errors = await loadPage(page, tablePage)

    const table = page.getByRole('table')
    await expect(table).toBeVisible()
    await expect(page.getByTestId('station-map')).toHaveCount(0)
    expect(mapboxRequests).toBe(0)

    await expect(table.getByRole('rowheader', { name: 'Other' })).toBeVisible()
    await expect(
      table.getByRole('columnheader', { name: /^Temp F\b.*Air Temperature/ }),
    ).toBeVisible()
    // Default sort is elevation ascending; the station with no coordinates is dropped as on the map.
    await expect(stationNames(page)).toHaveText([
      'CW6318 Welches',
      'White Chuck Mountain',
      'Hurricane Ridge',
      'Green Lake',
    ])
    await expect(table.getByRole('columnheader', { name: /Elev/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )

    // SAC's `within` is three hours; every fixture reading is older.
    await expect(
      table.getByRole('row', { name: /Green Lake/ }).getByText('(Data is older than 3 hours)'),
    ).toBeAttached()
    expect(errors).toEqual([])
  })

  test('sorts both ways, keeps the sort across a reload, and Reset clears it', async ({ page }) => {
    await loadPage(page, tablePage)
    const elevation = page.getByRole('columnheader', { name: /Elev/ })

    await elevation.getByRole('button').click()
    await expect(elevation).toHaveAttribute('aria-sort', 'descending')
    await expect(stationNames(page)).toHaveText([
      'Green Lake',
      'Hurricane Ridge',
      'White Chuck Mountain',
      'CW6318 Welches',
    ])

    await page.reload()
    await expect(page.getByRole('columnheader', { name: /Elev/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )

    // Reset is offered for the sort alone, with no filter set.
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByRole('columnheader', { name: /Elev/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await expect(stationNames(page)).toHaveText([
      'CW6318 Welches',
      'White Chuck Mountain',
      'Hurricane Ridge',
      'Green Lake',
    ])
  })

  test('the toolbar button swaps the map for the table and back, and the link says which', async ({
    page,
  }) => {
    await stubMapbox(page)
    await loadPage(page, `${tenant('sac')}/weather/stations/map?source=snotel`)

    await page.getByRole('button', { name: 'Table', exact: true }).click()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page).toHaveURL(/[?&]view=table/)
    await expect(page).toHaveURL(/[?&]source=snotel/)
    await expect(stationNames(page)).toHaveText(['Green Lake'])

    await page.getByRole('button', { name: 'Map', exact: true }).click()
    await expect(page.getByTestId('station-map')).toBeVisible()
    await expect(page).not.toHaveURL(/view=table/)

    // Each switch is a history entry, as the widget's router links were.
    await page.goBack()
    await expect(page.getByRole('table')).toBeVisible()
    await page.goBack()
    await expect(page.getByTestId('station-map')).toBeVisible()
  })

  test("the widget's #/station-table/:id link opens the table on that station", async ({
    page,
  }) => {
    await loadPage(page, `${tenant('sac')}/weather/stations/map#/station-table/502`)

    await expect(page.getByRole('row', { name: /Green Lake/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await expect(page).toHaveURL(/\?view=table$/)
  })

  test("a widget link's zone filter, carried in its hash, still applies", async ({ page }) => {
    await loadPage(page, `${tenant('sac')}/weather/stations/map#/station-table?zone=["Other"]`)

    await expect(stationNames(page)).toHaveText([
      'CW6318 Welches',
      'White Chuck Mountain',
      'Hurricane Ridge',
      'Green Lake',
    ])
    await expect(page).toHaveURL(/[?&]zone=Other/)
    await expect(page).toHaveURL(/[?&]view=table/)
  })

  test('picking a station in the search picks out its row', async ({ page }) => {
    await loadPage(page, tablePage)
    await page.getByRole('searchbox', { name: 'Search for station' }).first().fill('white chuck')
    await page.getByRole('button', { name: /White Chuck Mountain/ }).click()

    await expect(page.getByRole('row', { name: /White Chuck Mountain/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  test('at phone width the table scrolls inside its frame, not the page', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await loadPage(page, tablePage)
    await expect(page.getByRole('table')).toBeVisible()

    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(PHONE.width)
  })
})
