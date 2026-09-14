import type { Media, Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const getGalleriesData = (
  tenant: Tenant,
  image1: Media,
  image2: Media,
  imageMountain: Media,
): RequiredDataFromCollectionSlug<'galleries'>[] => {
  return [
    {
      title: 'Season Highlights',
      tenant: tenant.id,
      items: [
        {
          type: 'upload',
          media: imageMountain.id,
          caption: 'Early season snowpack in the alpine.',
        },
        {
          type: 'upload',
          media: image1.id,
          caption: 'Crew digging a snow pit to assess stability.',
        },
        {
          type: 'upload',
          media: image2.id,
        },
        {
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoTitle: 'How to read an avalanche forecast',
          caption: 'A quick primer for new backcountry users.',
        },
        {
          type: 'video',
          videoUrl: 'https://vimeo.com/642827713',
          videoTitle: 'Featured clip on Vimeo',
          caption: 'A short clip hosted on Vimeo.',
        },
      ],
    },
  ]
}
