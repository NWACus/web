<script setup lang="ts">
import { BLOCKS } from '@contentful/rich-text-types'

import type { TocLink } from '@nuxt/content'
import type { EntryCollection } from 'contentful'
import type { TypeBlogPostSkeleton } from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.slug !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad blog slug: ${route.params.slug}`, fatal: true })
}
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeBlogPostSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/blog.json', {
  method: 'GET',
  query: { slug: route.params.slug }
})

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
    if (!data.value || !data.value.items || !data.value.items[0]) {
      return []
    }
    for (const node of data.value.items[0].fields.body.content) {
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
  <UContainer v-if="data && data.items && data.items[0]">
    <UPageHeader
      :title="data.items[0].fields.title"
      :description="data.items[0].fields.subtitle"
    >
      <template #headline>
        <time class="text-gray-500 dark:text-gray-400">{{ new Date(data.items[0].fields.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }) }}</time>
      </template>

      <div class="flex flex-wrap items-center gap-3 mt-4">
        <UButton
          v-for="(author, index) in data.items[0].fields.author"
          :key="index"
          :to="`/${route.params.avalancheCenter}/about/staff?member=` + encodeURIComponent(`${author?.fields.firstName} ${author?.fields.lastName}`)"
          color="white"
          target="_blank"
          size="sm"
        >
          <UAvatar
            provider="contentful"
            :src="author?.fields.photo?.fields.file?.url"
            :alt="`${author?.fields.firstName} ${author?.fields.lastName}`"
            size="2xs"
          />

          {{ `${author?.fields.firstName} ${author?.fields.lastName}` }}
        </UButton>
      </div>
    </UPageHeader>

    <UPage>
      <template #right>
        <UContentToc :links="links" />
      </template>

      <UPageBody :prose="true">
        <RichTextTopLevelBlock
          v-for="(block, index) in data.items[0].fields.body.content"
          :key="`${data.items[0].sys.id}-block-${index}`"
          :block="block"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
