<script setup lang="ts">
import type { Entry } from 'contentful'
import type { TypeSimpleArticleSkeleton } from '~~/types/generated/contentful'

const props = defineProps<{
  entry: Entry<TypeSimpleArticleSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}
</script>

<template>
  <div class="prose prose-primary dark:prose-invert max-w-none">
    <RichTextTopLevelBlock
      v-for="block in props.entry.fields.body.content"
      :block="block"
    />
  </div>
</template>
