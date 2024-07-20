<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { TypeSimpleArticleSkeleton } from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.slug !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad article slug: ${route.params.slug}`, fatal: true })
}
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeSimpleArticleSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/article.json', {
  method: 'GET',
  query: { slug: route.params.slug }
})
</script>

<template>
  <RichTextDocument
    v-if="data?.items[0]?.fields.body"
    :rich-text="data.items[0]?.fields.body"
  />
</template>
