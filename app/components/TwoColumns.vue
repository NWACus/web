<script setup lang="ts">
import type { Entry } from 'contentful'
import {
  type TypeTwoColumns,
  type TypeOneColumnSkeleton,
  type TypeSimpleArticleSkeleton,
  type TypeTwoColumnsSkeleton
} from '~~/types/generated/contentful'

const props = defineProps<{
  entry: TypeTwoColumns<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const leftContent = computed(
  () => {
    const entries: Entry<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    for (const entry of props.entry.fields.leftContent) {
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  }
)
const rightContent = computed(
  () => {
    const entries: Entry<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    for (const entry of props.entry.fields.rightContent) {
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  }
)
const gridConfig = computed(
  () => {
    switch (props.entry.fields.layout) {
      case 'Two Columns - Left Aside (25%/75%)':
        return { columns: 'md:grid-cols-4', left: 'md:col-span-1', right: 'md:col-span-3' }
      case 'Two Columns - Left Heavy (66%/33%)':
        return { columns: 'md:grid-cols-3', left: 'md:col-span-2', right: 'md:col-span-1' }
      case 'Two Columns - Right Aside (75%/25%)':
        return { columns: 'md:grid-cols-4', left: 'md:col-span-3', right: 'md:col-span-1' }
      case 'Two Columns - Right Heavy (33%/66%)':
        return { columns: 'md:grid-cols-3', left: 'md:col-span-1', right: 'md:col-span-2' }
      case 'Two Columns - Even Split (50%/50%)':
        return { columns: 'md:grid-cols-2', left: 'md:col-span-1', right: 'md:col-span-1' }
    }
  }
)
</script>

<template>
  <div :class="`container grid grid-cols-1 ${gridConfig.columns} gap-4`">
    <div :class="`grid-col-span-1 ${gridConfig.left}`">
      <RichTextEmbeddedEntry
        v-for="item in leftContent"
        :key="item.sys.id"
        :entry="item"
      />
    </div>
    <div :class="`grid-col-span-1 ${gridConfig.right}`">
      <RichTextEmbeddedEntry
        v-for="item in rightContent"
        :key="item.sys.id"
        :entry="item"
      />
    </div>
  </div>
</template>
