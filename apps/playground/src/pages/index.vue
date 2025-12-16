<script setup lang="ts">
import type { IconifyInfo } from '@iconify/types'
import type { PackageJSON } from '@package-json/types'

import { Button, Input } from '@proj-airi/ui'
import { useMotion } from '@vueuse/motion'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const pageTitleRef = ref<HTMLElement>()
const route = useRoute()
const router = useRouter()
const collectionQuery = ref('@proj-airi/lobe-icons')
const collections = ref<({ id: string, iconify: IconifyInfo & { prefix: string }, package: PackageJSON })[]>([])

const { apply } = useMotion(pageTitleRef, {
  initial: { opacity: 0, x: 10, transition: { duration: 250 } },
  enter: { opacity: 1, x: 0, transition: { duration: 250 } },
  leave: { opacity: 0, x: -10, transition: { duration: 100 } },
})

const sampleIcons = ref<Record<string, string[]>>({})

onMounted(async () => {
  await apply('initial')
  await apply('enter')
})

onUnmounted(async () => {
  await apply('leave')
})

watch([route], async () => {
  await apply('leave')

  await apply('initial')
  await apply('enter')
})

function goToCollection(id?: string) {
  const target = (id ?? collectionQuery.value).trim()
  if (!target)
    return

  const cleaned = target.replace(/^\/+/, '')
  const safeTarget = encodeURI(cleaned)
  router.push(`/collection/${safeTarget}`)
}

async function loadFeaturedSample(collectionId: string) {
  const loaders: Record<string, () => Promise<[PackageJSON, IconifyInfo, string[]]>> = {
    '@proj-airi/lobe-icons': async () => {
      const info = await import('@proj-airi/lobe-icons')
      const packageJson = await import('@proj-airi/lobe-icons/package.json') as PackageJSON
      return [packageJson, info.info, info.info.samples || []]
    },
    '@proj-airi/iconify-meteocons': async () => {
      const info = await import('@proj-airi/iconify-meteocons')
      const packageJson = await import('@proj-airi/iconify-meteocons/package.json') as PackageJSON
      return [packageJson, { ...info.info, prefix: 'iconify-meteocons' }, info.info.samples || []]
    },
  }

  const loader = loaders[collectionId]
  if (!loader)
    return

  try {
    const [packageJson, info, icons] = await loader()
    collections.value.push({ iconify: info as IconifyInfo & { prefix: string }, package: packageJson, id: collectionId })
    sampleIcons.value[collectionId] = icons
  }
  catch (error) {
    console.error('Failed to load preview icons for', collectionId, error)
  }
}

onMounted(() => {
  loadFeaturedSample('@proj-airi/lobe-icons')
  loadFeaturedSample('@proj-airi/iconify-meteocons')
})
</script>

<template>
  <div flex flex-col gap-6 relative h-full items-center>
    <div
      ref="pageTitleRef"
      w="100% md:75dvw" rounded-2xl p-6 h="50%"
      border="neutral-200 dark:neutral-800"
      flex="~ items-center"
      bg="gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950"
    >
      <form flex="~ col md:row gap-3 items-center" mt-4 w-full @submit.prevent="goToCollection()">
        <Input
          v-model="collectionQuery"
          type="search"
          placeholder="Enter Iconify collection id (e.g. @proj-airi/iconify-meteocons)"
          class="min-h-10"
        />
        <Button class="w-25% sm:w-full sm:max-w-25%">
          Go
        </Button>
      </form>
    </div>

    <div grid="~ cols-1 md:cols-2 gap-4" h="fit sm:50%" w-full>
      <div
        v-for="(collection, index) in collections"
        :key="collection.id"
        v-motion="{
          initial: { opacity: 0, y: 12, scale: 0.98 },
          enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 300, delay: index * 80 } },
          visibleOnce: { opacity: 1, y: 0, scale: 1 },
        }"
        rounded-xl
        p-4
        shadow-sm
        h-fit
        bg="white dark:neutral-900"
        border="2 neutral-100 dark:neutral-900"
        shadow-2xl
        class="backdrop-blur-sm cursor-pointer transition-transform duration-150 hover:translate-y--1"
        role="button"
        tabindex="0"
        @click="goToCollection(collection.id)"
        @keypress.enter="goToCollection(collection.id)"
      >
        <div flex="~ items-start justify-between gap-2" mb-4>
          <div flex flex-col gap-1 w-full>
            <div text-lg font-semibold flex="~ gap-1">
              <span flex flex-1>{{ collection.iconify.name }}</span><span text="sm neutral-500 dark:neutral-400" font-mono>{{ collection.package.name }}</span>
            </div>
            <div text="sm neutral-500 dark:neutral-400">
              {{ collection.package.description }}
            </div>
          </div>
        </div>
        <div flex text="[48px]" gap-1>
          <div v-for="(sample, sampleIndex) in collection.iconify.samples" :key="sampleIndex" :class="[`i-${collection.iconify.prefix}:${sample}`]" />
        </div>
      </div>
    </div>
  </div>
</template>
