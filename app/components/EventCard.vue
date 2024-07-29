<script setup lang="ts">
import type { TypeEvent } from '~~/types/generated/contentful'
import type { UBlogPost } from '#components'

const props = withDefaults(defineProps<{
  event: TypeEvent<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
  index: number
  class: any
  ui: Partial<typeof config.value>
}>(), {
  class: undefined,
  ui: () => ({})
})

const config = computed(() => {
  return {
    badge: {
      wrapper: 'mb-3',
      base: 'capitalize'
    },
    date: 'text-sm text-gray-500 dark:text-gray-400 font-medium pointer-events-none'
  }
})

const { ui } = useUI('blog.post', toRef(props, 'ui'), config, toRef(props, 'class'), true)
</script>

<template>
  <UBlogPost
    :to="'events/' + event.fields.slug"
    :title="event.fields.name"
    :description="event.fields.blurb"
    :image="{ provider: 'contentful', src: event.fields.image?.fields.file?.url }"
    orientation="horizontal"
    class="col-span-full"
    :date="new Date()"
    :ui="{
      description: 'line-clamp-2'
    }"
  >
    <template
      v-if="event.fields.labels && event.fields.labels.length > 0"
      #badge
    >
      <UBadge
        v-for="badge in event.fields.labels"
        :key="badge"
        :label="badge"
        variant="subtle"
        :class="ui.badge.base"
      />
    </template>
    <template #date>
      <div class="flex gap-x-1">
        <UIcon
          name="i-heroicons-clock"
          class="w-5 h-5"
        />
        <time
          :datetime="new Date(event.fields.date).toISOString()"
          :class="ui.date"
        >
          {{ new Date(event.fields.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric' }) }}
        </time>
      </div>
      <div class="flex gap-x-1">
        <UIcon
          name="i-heroicons-map-pin"
          class="w-5 h-5"
        />
        <div :class="ui.date">
          {{ event.fields.locationName }}
        </div>
      </div>
      <div
        class="flex gap-x-1"
      >
        <UIcon
          name="i-heroicons-ticket"
          class="w-5 h-5"
        />
        <div
          v-if="event.fields.entryPrice"
          :class="ui.date"
        >
          {{ new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(event.fields.entryPrice) }}
        </div>
        <div
          v-else
          :class="ui.date"
        >
          Free
        </div>
      </div>
    </template>
  </UBlogPost>
</template>
