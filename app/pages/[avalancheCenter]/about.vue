<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { TypeGroup, TypeGroupOrderSkeleton } from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const avalancheCenter = route.params.avalancheCenter.toUpperCase()
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeGroupOrderSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/staff.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter }
})

const groups = computed(
  (): TypeGroup<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] => {
    const groups: TypeGroup<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] = []
    if (data.value) {
      for (const grouping of data.value.items) {
        if (grouping.fields.groups) {
          for (const group of grouping.fields.groups) {
            if (group) {
              groups.push(group)
            }
          }
        }
      }
    }
    return groups
  }
)
</script>

<template>
  <div>
    <AppHeader :avalanche-center="avalancheCenter" />

    <UMain>
      <UContainer v-if="data">
        <UCard
          v-for="group in groups"
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
      <NuxtPage />
    </UMain>

    <AppFooter />
  </div>
</template>
