<script setup lang="ts">
import {
  type TypeOneColumn,
} from '~~/types/generated/contentful'

const props = defineProps<{
  entry: TypeOneColumn<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}
</script>

<template>
  <UPage>
    <UPageBody>
      <OneColumn :entry="entry" />
    </UPageBody>
  </UPage>
</template>
