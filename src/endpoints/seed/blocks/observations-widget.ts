import { RequiredDataFromCollectionSlug } from 'payload'

export const observationsWidgetBlocks: RequiredDataFromCollectionSlug<'pages'>['layout'] = [
  {
    blockType: 'observationsWidget',
    showHeader: true,
    heading: 'Recent Avalanches',
    tab: 'avalanches',
    dateRange: 'pastMonth',
  },
]
