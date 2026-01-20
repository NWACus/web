import { BlogListBlock } from '@/blocks/BlogList/config'
import { ContentBlock } from '@/blocks/Content/config'
import { DocumentBlock } from '@/blocks/Document/config'
import { EventListBlock } from '@/blocks/EventList/config'
import { EventTableBlock } from '@/blocks/EventTable/config'
import { FormBlock } from '@/blocks/Form/config'
import { GenericEmbedBlock } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { ImageLinkGridBlock } from '@/blocks/ImageLinkGrid/config'
import { ImageTextBlock } from '@/blocks/ImageText/config'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlock } from '@/blocks/SingleBlogPost/config'
import { SingleEventBlock } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'
import { TeamBlock } from '@/blocks/Team/config'

export const DEFAULT_BLOCKS = [
  BlogListBlock,
  SingleBlogPostBlock,
  ContentBlock,
  DocumentBlock,
  EventListBlock,
  SingleEventBlock,
  EventTableBlock,
  FormBlock,
  GenericEmbedBlock,
  HeaderBlock,
  ImageLinkGridBlock,
  ImageTextBlock,
  LinkPreviewBlock,
  MediaBlock,
  SponsorsBlock,
  TeamBlock,
]

export const POSTS_LIMIT: number = 10
export const EVENTS_LIMIT: number = 10
export const COURSES_LIMIT: number = 10
