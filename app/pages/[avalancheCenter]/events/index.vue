<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import { compareDesc } from 'date-fns'
import type { TypeEventSkeleton, TypeEvent } from '~~/types/generated/contentful'

const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const avalancheCenter = route.params.avalancheCenter.toUpperCase()
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeEventSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/events.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter }
})

const events = computed(
  (): TypeEvent<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>[] => {
    const events = []
    if (data.value) {
      for (const event of data.value.items) {
        if (event) {
          events.push(event)
        }
      }
    }
    events.sort((a, b) => {
      return compareDesc(new Date(a.fields.date), new Date(b.fields.date))
    })
    return events
  }
)
</script>

<template>
  <UPageBody>
    <UBlogList>
      <EventCard
        v-for="(event, index) in events"
        :key="index"
        :event="event"
        :index="index"
      />
    </UBlogList>
  </UPageBody>
</template>
