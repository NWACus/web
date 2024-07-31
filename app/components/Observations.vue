<script setup lang="ts">

const route = useRoute()
const avalancheCenter = route.params.avalancheCenter.toUpperCase()

</script>

<template>
    <div class="text-gray-900 dark:text-white text-l font-semibold truncate group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">Observations</div>

    <component :is="'script'" src="https://du6amfiq9m9h7.cloudfront.net/loader/nac-widget-loader.min.js" data-widget="observations" :data-center="avalancheCenter"></component>
</template>