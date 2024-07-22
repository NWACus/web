<script setup lang="ts">
import { type TypeNews } from '~~/types/generated/contentful'
const props = defineProps<{
  news: TypeNews<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()
</script>

<template>
    <UCard>
        <h1> {{ props.news.fields.newsTitle }}</h1>
        <div> {{ props.news.fields.newsDescription }}</div>
    </UCard>
</template>