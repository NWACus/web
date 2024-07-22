<script setup lang="ts">
const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}

const avalancheCenter = route.params.avalancheCenter
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeHomePageSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/home.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter.toUpperCase() }
})

var displayableNews = computed(
  (): TypeNews<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] => {
    var displayableNews: TypeNews<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    if (data.value) {
      for (const items of data.value.items) {
        
        if(items.fields.news) {
          displayableNews = items.fields.news
        }
      }
    }
    return displayableNews
  }
)
  var displayableMap = computed(
  (): TypeForecastMap<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] => {
    var displayableMap: TypeForecastMap<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    if (data.value) {
      for (const items of data.value.items) {
        if(items.fields.forecast) {
          displayableMap = items.fields.forecast
        }
      }
    }
    return displayableMap
  }
)
</script>

<template>
    <UMain>
      <UContainer>
        <UPage>
        <HomePage
            v-if="displayableMap"
            :forecast="displayableMap"
            :news="displayableNews"/>
      <NuxtPage />
    </UPage>
  </UContainer>
    </UMain>
</template>