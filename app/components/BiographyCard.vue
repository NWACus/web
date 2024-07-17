<script setup lang="ts">
import { type TypeBiography } from '~~/types/generated/contentful'

const props = defineProps<{
  person: TypeBiography<'WITHOUT_UNRESOLVABLE_LINKS', 'en'>
}>()
const modalOpen = ref(false)
</script>

<template>
  <UCard
    class="m-2 group flex"
    @click="modalOpen = true"
  >
    <div
      class="flex flex-col items-center justify-center"
    >
      <NuxtImg
        v-if="props.person.fields.photo && props.person.fields.photo.fields.file && props.person.fields.photo.fields.file.details.image"
        provider="contentful"
        sizes="100vw sm:17.5vw md:15vw lg:12.5vw xl:10vw xxl:7.5vw"
        :src="props.person.fields.photo.fields.file.url"
        class="rounded-xl m-2 transform transition-transform duration-200 group-hover:scale-105"
      />
      <h2 class="text-gray-900 dark:text-white text-l font-semibold truncate group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
        {{ props.person.fields.firstName }} {{ props.person.fields.lastName }}
      </h2>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ props.person.fields.title }}
      </div>
    </div>
  </UCard>
  <UModal
    v-model="modalOpen"
    :ui="{ width: 'w-full sm:max-w-3xl lg:max-w-5xl' }"
  >
    <UCard
      @click="modalOpen = true"
    >
      <div class="flex flex-row items-center justify-center gap-x-12 mx-8">
        <div
          class="flex flex-col items-center justify-center min-w-56"
        >
          <NuxtImg
            v-if="props.person.fields.photo && props.person.fields.photo.fields.file && props.person.fields.photo.fields.file.details.image"
            provider="contentful"
            sizes="100vw sm:35vw md:32.5vw lg:30vw xl:27.5vw xxl:25vw"
            :src="props.person.fields.photo.fields.file.url"
            class="rounded-xl m-2"
          />
          <h2 class="text-gray-900 dark:text-white text-l font-semibold truncate">
            {{ props.person.fields.firstName }} {{ props.person.fields.lastName }}
          </h2>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ props.person.fields.title }}
          </div>
        </div>
        <div
          v-if="props.person.fields.biography"
          class="p-4 flex grow text-sm text-gray-500 dark:text-gray-400"
        >
          {{ props.person.fields.biography }}
        </div>
      </div>
    </UCard>
  </UModal>
</template>
