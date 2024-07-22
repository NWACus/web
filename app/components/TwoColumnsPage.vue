<script setup lang="ts">
import {
  type TypeTwoColumns,
} from '~~/types/generated/contentful'

const props = defineProps<{
  entry: TypeTwoColumns<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()

if (!props.entry) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}
</script>

<template>
  <UPage>
    <UPageBody>
      <TwoColumns :entry="entry" />
    </UPageBody>
  </UPage>
</template>
