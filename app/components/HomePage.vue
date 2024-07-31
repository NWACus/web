<script setup lang="ts">
import { type TypeForecastMap, type TypeNews } from '~~/types/generated/contentful'

const props = defineProps<{
  avalancheCenter: string
  forecast: TypeForecastMap<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
  news: TypeNews<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()
</script>

<template>
  <div class="flex flex-row  gap-x-8 mx-20">
    <ForecastMapCard
      v-if="props.forecast"
      :forecast="props.forecast"
      :avalanche-center="props.avalancheCenter"
    />

    <NewsCard
      v-if="props.news"
      :news="props.news"
    />
  </div>
</template>
