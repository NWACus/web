<script setup lang="ts">
import { type TypeNews } from '~~/types/generated/contentful'

const props = defineProps<{
  news: TypeNews<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()
</script>

<template>
  <UCard>
    <div class="text-gray-900 dark:text-white text-l font-semibold truncate group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
      {{ props.news.fields.newsTitle }}
    </div>

    <RichTextDocument
      v-if="props.news.fields.newsDescription"
      :rich-text="props.news.fields.newsDescription"
    />
  </UCard>
</template>
