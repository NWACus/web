import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const mediaBlocks = (image: Media): RequiredDataFromCollectionSlug<'pages'>['layout'] => [
  {
    media: image.id,
    caption: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'A small-sized media block with left alignment',
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
    backgroundColor: 'brand-100',
    alignContent: 'left',
    imageSize: 'small',
    blockType: 'mediaBlock',
  },
  {
    media: image.id,
    caption: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'A medium-sized media block with center alignment',
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
    backgroundColor: 'brand-300',
    alignContent: 'center',
    imageSize: 'medium',
    blockType: 'mediaBlock',
  },
  {
    media: image.id,
    caption: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'A large-sized media block with right alignment',
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
    backgroundColor: 'brand-500',
    alignContent: 'right',
    imageSize: 'large',
    blockType: 'mediaBlock',
  },
  {
    media: image.id,
    caption: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'A full-width media block with center alignment',
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
    backgroundColor: 'brand-700',
    alignContent: 'center',
    imageSize: 'full',
    blockType: 'mediaBlock',
  },
  {
    media: image.id,
    caption: null,
    backgroundColor: 'brand-200',
    alignContent: 'center',
    imageSize: 'original',
    blockType: 'mediaBlock',
  },
]
