/**
 * The address NWAC's widget config gives its Weather Forecast tab (nwac.us's old tab content), so
 * the widget's request is answered once nwac.us is AvyWeb. WidgetZoneWeather hides what lands here
 * and renders the tab itself; this fragment is only seen if that script doesn't run.
 */
const FRAGMENT =
  '<p>See the <a href="/weather/forecast">Mountain Weather Forecast</a> for every zone.</p>'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string }> },
): Promise<Response> {
  if ((await params).center !== 'nwac') return new Response('Not found', { status: 404 })
  return new Response(FRAGMENT, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      // The widget fetches it cross-origin from preview and local hosts too.
      'Access-Control-Allow-Origin': '*',
    },
  })
}
