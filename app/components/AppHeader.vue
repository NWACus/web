<script setup lang="ts">
import type { NavItem } from '@nuxt/content'
import type { EntryCollection } from 'contentful'
import type { TypeLogoSkeleton } from '~~/types/generated/contentful'

const props = defineProps<{ avalancheCenter: string }>()
const avalancheCenter = props.avalancheCenter
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeLogoSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/logos.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter.toUpperCase() }
})

const navigation = inject<Ref<NavItem[]>>('navigation', ref([]))

const links = [{
  label: 'About',
  to: '/' + avalancheCenter.toLowerCase() + '/about/staff'
}]
</script>

<template>
  <UHeader
    :to="'/' + avalancheCenter"
    :links="links"
  >
    <template #logo>
      <div v-if="error">
        {{ error }}
      </div>
      <div class="group flex flex-row items-center justify-center">
        <NuxtImg
          v-if="data && data.items && data.items[0]?.fields.icon?.fields.file"
          provider="contentful"
          width="32px"
          height="32px"
          :src="data.items[0]?.fields.icon?.fields.file.url"
          class="rounded-xl m-2 transform transition-transform duration-200 group-hover:scale-105"
        />
        <span class="text-gray-900 dark:text-white text-l font-semibold truncate group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">{{ avalancheCenter.toUpperCase() }}</span>
      </div>
    </template>

    <template #right>
      <AvalancheCenterSelector />
      <UColorModeButton size="sm" />
    </template>
  </UHeader>
</template>
