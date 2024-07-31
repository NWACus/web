<script setup lang="ts">
useSeoMeta({
  titleTemplate: '',
  title: ''
})
</script>

<template>
  <div>
    <AppHeader avalanche-center="nac" />
    
    <UMain>
      <div class="flex flex-col items-center content-center justify-center">
        <AvalancheCenterSelector />
      </div>
      <NuxtPage />
    </UMain>

    <AppFooter />
  </div>
</template>
