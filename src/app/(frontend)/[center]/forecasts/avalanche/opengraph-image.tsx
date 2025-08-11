import { generateRouteImage } from '@/utilities/generateRouteImage'

export const runtime = 'edge'

export const alt = 'Avalanche Forecasts'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ center: string }> }) {
  const resolvedParams = await params

  return generateRouteImage({
    params: resolvedParams,
    type: 'forecasts',
    platform: 'og',
  })
}
