<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { TypeAboutSkeleton, TypeSimpleArticle } from '~~/types/generated/contentful'
import type { NavigationTree } from '#ui-pro/types'

const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const avalancheCenter = route.params.avalancheCenter.toUpperCase()
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeAboutSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/about.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter }
})

const links = computed(
  (): NavigationTree[] => {
    const articles: TypeSimpleArticle<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    if (data.value) {
      for (const grouping of data.value.items) {
        if (grouping.fields.articles) {
          for (const article of grouping.fields.articles) {
            if (article) {
              articles.push(article)
            }
          }
        }
      }
    }
    return [{
      label: 'Staff', to: 'staff'
    }, ...articles.map(article => ({ label: article.fields.title, to: article.fields.slug }))]
  }
)
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UAside>
            <UNavigationTree :links="links" />
          </UAside>
        </template>
        <NuxtPage />
      </UPage>
    </UContainer>
  </UMain>
</template>
