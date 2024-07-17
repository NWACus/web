<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { TypeGroupSkeleton } from '~~/types/generated/contentful'

const avalancheCenter = useAvalancheCenter()
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeGroupSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/about.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter }
})
</script>

<template>
  <UContainer v-if="data">
    <UCard
      v-for="group in data.items"
      :key="group.sys.id"
      class="m-8"
    >
      <template #header>
        <h1 class="text-gray-900 dark:text-white text-xl font-semibold truncate group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
          {{ group.fields.name }}
        </h1>
      </template>
      <template #default>
        <div class="flex flex-row flex-wrap items-center justify-center">
          <template
            v-for="member in group.fields.member"
            :key="member.sys.id"
          >
            <BiographyCard
              v-if="member"
              :person="member"
            />
          </template>
        </div>
      </template>
    </UCard>

    <NuxtPage />
  </UContainer>
</template>
