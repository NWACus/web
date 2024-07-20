<script setup lang="ts">
import type { TopLevelBlock } from '@contentful/rich-text-types'

const props = defineProps<{
  block: TopLevelBlock
}>()

if (!props.block) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}
</script>

<template>
  <RichTextBlock :block="block" />
</template>
