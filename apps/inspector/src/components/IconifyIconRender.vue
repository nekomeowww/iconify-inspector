<script setup lang="ts">
import type { IconifyJSON } from '@iconify/types'

import { getIconData, iconToSVG, replaceIDs } from '@iconify/utils'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  icons: IconifyJSON
}>()

const svg = computed(() => {
  const icon = getIconData(props.icons, props.name)
  const { attributes, body } = iconToSVG(icon, {
    // keep original aspect ratio, size follows font-size
    height: '1em',
  })
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')

  return `<svg ${attrs}>${replaceIDs(body)}</svg>`
})
</script>

<template>
  <span
    style="overflow: visible;"
    :class="[props.name]"
    v-html="svg"
  />
</template>
