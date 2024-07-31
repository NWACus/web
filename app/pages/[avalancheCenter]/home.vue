<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { TypeForecastMap, TypeHomePageSkeleton, TypeNews } from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}

const avalancheCenter = route.params.avalancheCenter
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeHomePageSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/home.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter.toUpperCase() }
})

const displayableNews = computed(
  (): TypeNews<'WITHOUT_UNRESOLVABLE_LINKS', 'en'> | undefined => {
    if (data.value) {
      for (const items of data.value.items) {
        if (items.fields.news) {
          return items.fields.news
        }
      }
    }
    return undefined
  }
)
const displayableMap = computed(
  (): TypeForecastMap<'WITHOUT_UNRESOLVABLE_LINKS', 'en'> | undefined => {
    if (data.value) {
      for (const items of data.value.items) {
        if (items.fields.forecast) {
          return items.fields.forecast
        }
      }
    }
    return undefined
  }
)
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <HomePage
          v-if="displayableMap && displayableNews"
          :forecast="displayableMap"
          :news="displayableNews"
          :avalanche-center="avalancheCenter"
        />
        <NuxtPage />
      </UPage>
    </UContainer>
  </UMain>
</template>
