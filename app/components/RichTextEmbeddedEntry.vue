<script setup lang="ts">
import type { Entry } from 'contentful'
import {
  isTypeOneColumn, isTypeSimpleArticle, isTypeTwoColumns,
  type TypeOneColumnSkeleton,
  type TypeSimpleArticleSkeleton,
  type TypeTwoColumnsSkeleton
} from '~~/types/generated/contentful'
import EmbeddedRichText from '~/components/EmbeddedRichText.vue'
import TwoColumns from '~/components/TwoColumns.vue'
import OneColumn from '~/components/OneColumn.vue'

const props = defineProps<{
  entry: Entry<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const componentType = computed(
  () => {
    if (isTypeOneColumn(props.entry)) {
      return OneColumn
    } else if (isTypeTwoColumns(props.entry)) {
      return TwoColumns
    } else if (isTypeSimpleArticle(props.entry)) {
      return EmbeddedRichText
    } else {
      throw createError({ statusCode: 500, statusMessage: `Invalid article`, fatal: true })
    }
  }
)
</script>

<template>
  <component
    :is="componentType"
    :entry="entry"
  />
</template>
