<script setup lang="ts">
const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const avalancheCenter = route.params.avalancheCenter
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <ForecastCard :avalanche-center="avalancheCenter" />
        <NuxtPage />
      </UPage>
    </UContainer>
  </UMain>
</template>
