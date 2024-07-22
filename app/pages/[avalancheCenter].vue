<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { TypeHomePageSkeleton, TypeForecastMap, TypeNews } from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const avalancheCenter = route.params.avalancheCenter

</script>

<template>
  <div>
    <AppHeader :avalanche-center="avalancheCenter" />
    <UMain>
      <NuxtPage />
    </UMain>

    <AppFooter />
  </div>
</template>
