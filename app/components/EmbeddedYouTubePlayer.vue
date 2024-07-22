<script setup lang="ts">
import type { Entry } from 'contentful'
import type { TypeEmbeddedYouTubeVideoSkeleton } from '~~/types/generated/contentful'

const props = defineProps<{
  entry: Entry<TypeEmbeddedYouTubeVideoSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Video not found`, fatal: true })
}
</script>

<template>
  <ScriptYouTubePlayer :video-id="entry.fields.videoId">
    <template
      v-if="entry.fields.thumbnail"
      #placeholder
    >
      <NuxtImg
        provider="contentful"
        :src="entry.fields.thumbnail.fields.file?.url"
      />
    </template>
  </ScriptYouTubePlayer>
</template>
