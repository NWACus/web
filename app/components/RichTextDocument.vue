<script setup lang="ts">
import type { EntryFields } from 'contentful'
import { BLOCKS } from '@contentful/rich-text-types'

import type { TocLink } from '@nuxt/content'

const props = defineProps<{
  richText: EntryFields.RichText
}>()

if (!props.richText) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const headerDepth = {
  [BLOCKS.HEADING_1]: 1,
  [BLOCKS.HEADING_2]: 2,
  [BLOCKS.HEADING_3]: 3,
  [BLOCKS.HEADING_4]: 4,
  [BLOCKS.HEADING_5]: 5,
  [BLOCKS.HEADING_6]: 6
}

const headingKebabCase = (heading: string) => encodeURIComponent(heading.toLowerCase().replaceAll(/\s+/g, '-'))

const links = computed<TocLink[]>(
  () => {
    const links: TocLink[] = []
    for (const node of props.richText.content) {
      if (!Object.keys(headerDepth).includes(node.nodeType)) {
        continue
      }

      if (node.content.length === 0 || node.content[0]?.nodeType != 'text') {
        continue
      }

      const tocLink = {
        id: headingKebabCase(node.content[0].value),
        text: node.content[0].value,
        depth: headerDepth[node.nodeType]
      }

      if (links.length > 0 && links[links.length - 1] && node.nodeType !== BLOCKS.HEADING_1) {
        if (!links[links.length - 1]?.children) {
          links[links.length - 1].children = [tocLink]
        } else {
          links[links.length - 1]?.children?.push(tocLink)
        }
      } else {
        links.push(tocLink)
      }
    }
    return links
  }
)
</script>

<template>
  <UPage>
    <template #right>
      <UContentToc :links="links" />
    </template>

    <UPageBody :prose="true">
      <RichTextTopLevelBlock
        v-for="block in props.richText.content"
        :block="block"
      />
    </UPageBody>
  </UPage>
</template>
