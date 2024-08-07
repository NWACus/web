<script setup lang="ts">
const props = defineProps<{ avalancheCenter: string }>()
const avalancheCenter = props.avalancheCenter
</script>

<template>
  <ClientOnly>
    <component
      :is="'script'"
      src="https://du6amfiq9m9h7.cloudfront.net/loader/nac-widget-loader.min.js"
      data-widget="forecast"
      :data-center="avalancheCenter.toUpperCase()"
    />
  </ClientOnly>
</template>
