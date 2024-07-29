<script setup lang="ts">
import { BLOCKS } from '@contentful/rich-text-types'

import type { TocLink } from '@nuxt/content'
import type { EntryCollection } from 'contentful'
import type { TypeEventSkeleton } from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.slug !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad event slug: ${route.params.slug}`, fatal: true })
}
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeEventSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/event.json', {
  method: 'GET',
  query: { slug: route.params.slug }
})
</script>

<template>
  <UContainer v-if="data && data.items && data.items[0]">
    <UPageHeader
      :title="data.items[0].fields.name"
      :description="data.items[0].fields.blurb"
    >
      <template #headline>
        <div class="flex gap-x-1">
          <UIcon
            name="i-heroicons-clock"
            class="w-5 h-5"
          />
          <time
            :datetime="new Date(data.items[0].fields.date).toISOString()"
            class="text-gray-500 dark:text-gray-400"
          >
            {{ new Date(data.items[0].fields.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric' }) }}
          </time>
        </div>
        <div class="flex gap-x-1">
          <UIcon
            name="i-heroicons-map-pin"
            class="w-5 h-5"
          />
          <div class="text-gray-500 dark:text-gray-400">
            {{ data.items[0].fields.locationName }}
          </div>
        </div>
        <div
          class="flex gap-x-1"
        >
          <UIcon
            name="i-heroicons-ticket"
            class="w-5 h-5"
          />
          <div
            v-if="data.items[0].fields.entryPrice"
            class="text-gray-500 dark:text-gray-400"
          >
            {{ new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(data.items[0].fields.entryPrice) }}
          </div>
          <div
            v-else
            class="text-gray-500 dark:text-gray-400"
          >
            Free
          </div>
        </div>
      </template>
    </UPageHeader>

    <UPage>
      <UPageBody :prose="true">
        <RichTextTopLevelBlock
          v-for="(block, index) in data.items[0].fields.about.content"
          :key="`${data.items[0].sys.id}-block-${index}`"
          :block="block"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
