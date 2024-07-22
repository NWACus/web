<script setup lang="ts">
import type { Entry } from 'contentful'
import {
  type TypeOneColumn,
  type TypeOneColumnSkeleton,
  type TypeSimpleArticleSkeleton,
  type TypeTwoColumnsSkeleton
} from '~~/types/generated/contentful'

const props = defineProps<{
  entry: TypeOneColumn<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const content = computed(
  () => {
    const entries: Entry<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    for (const entry of props.entry.fields.content) {
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  }
)
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <RichTextEmbeddedEntry
      v-for="item in content"
      :key="item.sys.id"
      :entry="item"
    />
  </div>
</template>
