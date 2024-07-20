<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import type { TocLink } from '@nuxt/content'
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

const headingKebabCase = (heading: string) => encodeURIComponent(heading.toLowerCase().replaceAll(/\s+/g, '-'))

const links = computed<TocLink[]>(
  () => groups.value.map(group => ({ id: headingKebabCase(group.fields.name), text: group.fields.name, depth: 2 }))
)
</script>

<template>
  <UPage>
    <template #right>
      <UContentToc :links="links" />
    </template>

    <UPageBody :prose="true">
      <template
        v-for="group in groups"
        :key="group.sys.id"
      >
        <ProseH2 :id="headingKebabCase(group.fields.name)">
          {{ group.fields.name }}
        </ProseH2>
        <UCard>
          <div class="flex flex-row flex-wrap items-center justify-center not-prose">
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
        </UCard>
      </template>
    </UPageBody>
  </UPage>
</template>
