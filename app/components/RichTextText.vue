<script setup lang="ts">
import type { Text } from '@contentful/rich-text-types'
import { MARKS } from '@contentful/rich-text-types'

const props = defineProps<{
  block: Text
}>()

if (!props.block) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const mapping: Record<string, string> = {
  [MARKS.BOLD]: 'font-semibold',
  [MARKS.ITALIC]: 'italic',
  [MARKS.UNDERLINE]: 'underline'
  // [MARKS.CODE]: "code",
  // [MARKS.SUPERSCRIPT]: "superscript",
  // [MARKS.SUBSCRIPT]: "subscript",
  // [MARKS.STRIKETHROUGH]: "strikethrough"
}

const classes = computed(
  () => props.block.marks.map(mark => mapping[mark.type]).join(' ')
)
</script>

<template>
  <span
    v-if="props.block.marks.length > 0"
    :class="'text-gray-400 dark:text-white ' + classes"
  >
    {{ props.block.value }}
  </span>
  <template v-else>
    {{ props.block.value }}
  </template>
</template>
