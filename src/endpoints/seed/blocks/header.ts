import { RequiredDataFromCollectionSlug } from 'payload'
import { headingContent } from '../utilities'

export const headerBlock: RequiredDataFromCollectionSlug<'pages'>['layout'] = [
  {
    blockType: 'headerBlock',
    richText: headingContent('Welcome to the Avalanche Center', 'h2'),
    backgroundColor: 'brand-200',
  },
  {
    blockType: 'headerBlock',
    richText: headingContent('Stay Informed, Stay Safe', 'h3'),
    backgroundColor: 'transparent',
  },
]
