import { generateRouteImage } from '@/utilities/generateRouteImage'

export const runtime = 'edge'

export const alt = 'Blog'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ center: string }> }) {
  const resolvedParams = await params

  return generateRouteImage({
    params: resolvedParams,
    type: 'blog',
    platform: 'twitter',
  })
}
