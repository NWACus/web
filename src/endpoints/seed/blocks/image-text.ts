import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const imageText = (image: Media): RequiredDataFromCollectionSlug<'pages'>['layout'] => {
  return [
    {
      color: '#CBD5E1',
      imageLayout: 'left',
      image: image.id,
      richText: {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'This is a heading',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'heading',
              version: 1,
              tag: 'h2',
            },

            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Hoodie disrupt succulents church-key pug live-edge everyday carry paleo echo park shaman irony craft beer marxism. Big mood franzen snackwave Brooklyn. Copper mug bitters meh fit DIY banh mi sustainable knausgaard etsy hoodie twee fixie drinking vinegar cred. Activated charcoal fam truffaut humblebrag, gatekeep distillery raclette literally butcher.',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: 'start',
              indent: 0,
              type: 'paragraph',
              version: 1,
              textFormat: 0,
              textStyle: '',
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      blockType: 'imageText',
    },

    {
      color: '#334155',
      imageLayout: 'right',
      image: image.id,
      richText: {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'This is a hrading',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'heading',
              version: 1,
              tag: 'h2',
            },

            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Hoodie disrupt succulents church-key pug live-edge deveryday carry paleo echo park shaman irony craft beer marxism. Big mood franzen snackwave Brooklyn. Copper mug bitters meh fit DIY banh mi sustainable knausgaard etsy hoodie twee fixie drinking vinegar cred. Activated charcoal fam truffaut humblebrag, gatekeep distillery raclette literally butcher.',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: 'start',
              indent: 0,
              type: 'paragraph',
              version: 1,
              textFormat: 0,
              textStyle: '',
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      blockName: null,
      blockType: 'imageText',
    },
  ]
}
