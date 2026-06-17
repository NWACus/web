import { RequiredDataFromCollectionSlug } from 'payload'

export const videoEmbed: RequiredDataFromCollectionSlug<'pages'>['layout'] = [
  {
    blockType: 'videoEmbed',
    html: '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    backgroundColor: 'white',
    alignContent: 'center',
  },
]
