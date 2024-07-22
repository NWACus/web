<script setup lang="ts">
import type { Entry } from 'contentful'
import {
  isTypeOneColumn, isTypeSimpleArticle, isTypeTwoColumns,
  type TypeOneColumnSkeleton,
  type TypeSimpleArticleSkeleton,
  type TypeTwoColumnsSkeleton
} from '~~/types/generated/contentful'
import OneColumnPage from '~/components/OneColumnPage.vue'
import TwoColumnsPage from '~/components/TwoColumnsPage.vue'
import SimpleArticlePage from '~/components/SimpleArticlePage.vue'

const props = defineProps<{
  entry: Entry<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const componentType = computed(
  () => {
    if (isTypeOneColumn(props.entry)) {
      return OneColumnPage
    } else if (isTypeTwoColumns(props.entry)) {
      return TwoColumnsPage
    } else if (isTypeSimpleArticle(props.entry)) {
      return SimpleArticlePage
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
