<script setup lang="ts">
import type { Entry, EntryCollection } from 'contentful'
import type { TypeArticleSkeleton,
  TypeOneColumnSkeleton,
  TypeSimpleArticleSkeleton,
  TypeTwoColumnsSkeleton
} from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.slug !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad article slug: ${route.params.slug}`, fatal: true })
}
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeArticleSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/article.json', {
  method: 'GET',
  query: { slug: route.params.slug }
})

const articles = computed(
  () => {
    const articles: Entry<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    if (data.value && data.value.items[0]) {
      for (const article of data.value.items[0].fields.content) {
        if (article) {
          articles.push(article)
        }
      }
    }
    return articles
  }
)
</script>

<template>
  <div v-if="data && data.items[0]">
    <Article
      v-for="(item, index) in articles"
      :key="`${data.items[0].sys.id}-${index}`"
      :entry="item"
    />
  </div>
</template>
