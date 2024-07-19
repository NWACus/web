<script setup lang="ts">
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
      <div class="flex flex-col items-center content-center justify-center">
        <span class="flex m-12 text-gray-900 dark:text-white text-l font-semibold truncate hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">This space intentionally left blank.</span>
      </div>
      <NuxtPage />
    </UMain>

    <AppFooter />
  </div>
</template>
