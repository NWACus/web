import { BlogListBlock } from '@/blocks/BlogList/config'
import { Content } from '@/blocks/Content/config'
import { DocumentBlock } from '@/blocks/DocumentBlock/config'
import { EventListBlock } from '@/blocks/EventList/config'
import { EventTableBlock } from '@/blocks/EventTable/config'
import { FormBlock } from '@/blocks/Form/config'
import { GenericEmbed } from '@/blocks/GenericEmbed/config'
import { HeaderBlock } from '@/blocks/Header/config'
import { ImageLinkGrid } from '@/blocks/ImageLinkGrid/config'
import { ImageQuote } from '@/blocks/ImageQuote/config'
import { ImageText } from '@/blocks/ImageText/config'
import { ImageTextList } from '@/blocks/ImageTextList/config'
import { LinkPreviewBlock } from '@/blocks/LinkPreview/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { SingleBlogPostBlock } from '@/blocks/SingleBlogPost/config'
import { SingleEventBlock } from '@/blocks/SingleEvent/config'
import { SponsorsBlock } from '@/blocks/SponsorsBlock/config'
import { TeamBlock } from '@/blocks/Team/config'

export const DEFAULT_BLOCKS = [
  BlogListBlock,
  SingleBlogPostBlock,
  Content,
  DocumentBlock,
  EventListBlock,
  SingleEventBlock,
  EventTableBlock,
  FormBlock,
  GenericEmbed,
  HeaderBlock,
  ImageLinkGrid,
  ImageQuote,
  ImageText,
  ImageTextList,
  LinkPreviewBlock,
  MediaBlock,
  SponsorsBlock,
  TeamBlock,
]

export const POSTS_LIMIT: number = 10
export const EVENTS_LIMIT: number = 10
export const COURSES_LIMIT: number = 10
