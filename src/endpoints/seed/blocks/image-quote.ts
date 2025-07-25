import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const imageQuote = (image: Media): RequiredDataFromCollectionSlug<'pages'>['layout'] => {
  return [
    {
      backgroundColor: 'white',
      imageLayout: 'left',
      image: image.id,
      quote:
        "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
      author: 'Albert Einstein',
      blockName: null,
      blockType: 'imageQuote',
    },
    {
      backgroundColor: 'brand-700',
      imageLayout: 'right',
      image: image.id,
      quote:
        "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
      author: 'Maya Angelou',
      blockName: null,
      blockType: 'imageQuote',
    },
  ]
}
