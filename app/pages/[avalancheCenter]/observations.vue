<script setup lang="ts">
import type { NavigationTree } from '#ui-pro/types'

const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}

</script>

<template>
    <UMain>
      <UContainer>
        <UPage>
          <Observations />
          <NuxtPage />
        </UPage>
      </UContainer>
    </UMain>
  </template>