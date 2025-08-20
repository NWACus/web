import { RequiredDataFromCollectionSlug } from 'payload'

export const genericEmbed: RequiredDataFromCollectionSlug<'pages'>['layout'] = [
  {
    blockType: 'genericEmbed',
    html: '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    backgroundColor: 'white',
    alignContent: 'center',
  },
  {
    blockType: 'genericEmbed',
    html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Example embedded tweet content</p>&mdash; Twitter (@twitter) <a href="https://twitter.com/twitter/status/1">January 1, 2021</a></blockquote>',
    backgroundColor: 'brand-400',
    alignContent: 'left',
  },
  {
    blockType: 'genericEmbed',
    html: '<div style="padding: 20px; border: 2px solid #e74c3c; border-radius: 8px; background-color: #fff5f5;"><h3 style="color: #e74c3c; margin-top: 0;">Safety Alert</h3><p>Always check current avalanche conditions before heading into the backcountry.</p></div>',
    backgroundColor: 'transparent',
    alignContent: 'center',
  },
]
