<script setup lang="ts">
import type { Inline } from '@contentful/rich-text-types'
import { INLINES } from '@contentful/rich-text-types'
import { ProseA } from '#components'
import RichTextBlockChild from '~/components/RichTextBlockChild.vue'

const props = defineProps<{
  block: Inline
}>()

if (!props.block) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const blockType = computed(
  () => {
    return {
      [INLINES.HYPERLINK]: { component: ProseA, props: { href: props.block.data['uri'] } },
      [INLINES.ENTRY_HYPERLINK]: { component: '', props: {} },
      [INLINES.ASSET_HYPERLINK]: { component: '', props: {} },
      [INLINES.RESOURCE_HYPERLINK]: { component: '', props: {} },
      [INLINES.EMBEDDED_ENTRY]: { component: '', props: {} },
      [INLINES.EMBEDDED_RESOURCE]: { component: '', props: {} }
    }[props.block.nodeType]
  }
)
</script>

<template>
  <component
    :is="blockType.component"
    v-bind="blockType.props"
  >
    <RichTextBlockChild
      v-for="(child, index) in props.block.content"
      :key="`${String($.vnode.key)}-${index}`"
      :block="child"
    />
  </component>
</template>
