<script setup lang="ts">
import type { IconifyJSON } from '@iconify/types'

import { getIconCSS, getIconData } from '@iconify/utils'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  icons: IconifyJSON
}>()

const style = computed(() => {
  const icon = getIconData(props.icons, props.name)
  return getIconCSS(icon)
})
</script>

<template>
  <div :style="style" style="overflow: visible;" :class="[props.name]" />
</template>
