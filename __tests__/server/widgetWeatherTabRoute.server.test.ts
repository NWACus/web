import { GET } from '@/app/(frontend)/[center]/mountain-weather-forecast/current-tab/route'

function ask(center: string) {
  return GET(new Request(`http://localhost/${center}/mountain-weather-forecast/current-tab`), {
    params: Promise.resolve({ center }),
  })
}

describe('widget Weather Forecast tab route', () => {
  it('answers NWAC with a small fragment linking the Mountain Weather page', async () => {
    const res = await ask('nwac')

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/html')
    expect(await res.text()).toContain('href="/weather/forecast"')
  })

  it('is not found for any other center', async () => {
    expect((await ask('sac')).status).toBe(404)
  })
})
