<script setup lang="ts">
import { type TypeForecastMap } from '~~/types/generated/contentful'
const props = defineProps<{
  forecast: TypeForecastMap<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()
</script>

<template>
    <UCard>
        <h1> {{ props.forecast.fields.forecastHeader }}</h1>
        <component :is="'script'" src="https://du6amfiq9m9h7.cloudfront.net/loader/nac-widget-loader.min.js" data-widget="map" data-center="NWAC"></component>
    </UCard>
</template>