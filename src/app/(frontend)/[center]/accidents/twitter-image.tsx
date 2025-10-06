import { generateOGImage } from '@/utilities/generateOGImage'

export const alt = 'Accidents'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ center: string }> }) {
  const { center } = await params

  return generateOGImage({
    center,
    routeTitle: 'Accidents',
  })
}
