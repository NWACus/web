<script setup lang="ts">

const route = useRoute()
const avalancheCenter = route.params.avalancheCenter.toUpperCase()
</script>

<template>
    <UCard>
        <component :is="'script'" src="https://du6amfiq9m9h7.cloudfront.net/loader/nac-widget-loader.min.js" data-widget="forecast" :data-center="avalancheCenter"></component>
    </UCard>
</template>