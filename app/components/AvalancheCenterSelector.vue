<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { AllAvalancheCenterCapabilities } from '~~/types/nationalAvalancheCenter/capabilities'
import type { TypeLogoSkeleton } from '~~/types/generated/contentful'
import { useAvalancheCenter } from '~/composables/states'

const avalancheCenter = useAvalancheCenter()

const logosResult = await useFetch<EntryCollection<TypeLogoSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/logos.json', {
  method: 'GET',
})
const capabilitiesResult = await useFetch<AllAvalancheCenterCapabilities>('https://forecasts.avalanche.org', {
  method: 'GET',
  query: { rest_route: '/v1/public/avalanche-centers/' }
})

const supported = ['NWAC', 'SNFAC', 'SAC']

const items = [capabilitiesResult.data.value?.centers.filter(item => supported.includes(item.id)).map(item =>
  ({
    label: item.id,
    icon: logosResult.data.value?.items.find(logo => logo.metadata.tags.map(tag => tag.sys.id).includes(item.id.toLowerCase()))?.fields.icon?.fields.file?.url,
    click: () => avalancheCenter.value = item.id
  })
) || []]
</script>

<template>
  <UDropdown
    :items="items"
    :popper="{ placement: 'bottom-start' }"
  >
    <UButton
      color="white"
      label="Avalanche Center"
      trailing-icon="i-heroicons-chevron-down-20-solid"
    />

    <template #item="{ item }">
      <div class="group flex flex-row items-center justify-center">
        <NuxtImg
          v-if="item.icon"
          provider="contentful"
          width="24px"
          height="24px"
          :src="item.icon"
          class="rounded-xl m-2 transform transition-transform duration-200 group-hover:scale-105"
        />
        <span class="truncate">{{ item.label }}</span>
      </div>
    </template>
  </UDropdown>
</template>
