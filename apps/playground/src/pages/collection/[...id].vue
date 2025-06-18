<script setup lang="ts">
import type { IconifyInfo, IconifyJSON, IconifyJSONIconsData } from '@iconify/types'
import type { IconifyMetaData } from '@iconify/types'

import { useMotion } from '@vueuse/motion'
import {} from 'iconify-icon'
import { ofetch } from 'ofetch'
import { resolve } from 'resolve.exports'
import { onMounted, onUnmounted, ref, toRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import IconifyIconRender from '../../components/IconifyIconRender.vue'

const pageTitleRef = ref<HTMLElement>()
const route = useRoute('/collection/[...id]')
const iconifyJSONPackageId = toRef(() => route.params.id)

const loading = ref(false)

const { apply } = useMotion(pageTitleRef, {
  initial: { opacity: 0, x: 10, transition: { duration: 250 } },
  enter: { opacity: 1, x: 0, transition: { duration: 250 } },
  leave: { opacity: 0, x: -10, transition: { duration: 100 } },
})

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

const iconifyJSONInfo = ref<IconifyInfo>()
const iconifyJSONIcons = ref<IconifyJSONIconsData>()
const iconifyJSONMeta = ref<IconifyMetaData>()

function cdnFormatUnpkg(packageName: string, options?: { file?: string, version?: string }) {
  return `https://unpkg.com/${packageName}@${options.version ?? 'latest'}/${options?.file ?? 'index.js'}`
}

function _load(packageName: string, cdn: 'unpkg', options?: { file?: string, version?: string }) {
  switch (cdn) {
    case 'unpkg':
      return ofetch(cdnFormatUnpkg(packageName, options), { responseType: 'text' })
    default:
      throw new Error(`Unsupported CDN: ${cdn}`)
  }
}

function loadFromPackage<T = string>(packageName: string, cdn: 'unpkg', options?: { file?: string, version?: string, asJSON?: boolean, asText?: boolean }): Promise<T> {
  return _load(packageName, cdn, options)
    .then((data) => {
      if (options?.asJSON) {
        return JSON.parse(data)
      }
      else if (options?.asText) {
        return data
      }
      return data
    })
    .catch((error) => {
      console.error(`Failed to load package ${packageName} from ${cdn}:`, error)
      throw error
    })
}

function resolvePackageJSON(packageName: string, cdn: 'unpkg', options?: { version?: string }) {
  return loadFromPackage(packageName, cdn, { file: 'package.json', version: options?.version })
}

function normalizePath(filePath: string) {
  return filePath.replace('./', '')
}

onMounted(async () => await load())
watch(iconifyJSONPackageId, async () => await load(), { immediate: true })

async function load() {
  loading.value = true

  try {
    const packageJSON = await resolvePackageJSON(iconifyJSONPackageId.value, 'unpkg')

    const infoEntrypoint = resolve(JSON.parse(packageJSON), './info.json')
    if (!infoEntrypoint || !Array.isArray(infoEntrypoint) || infoEntrypoint.length === 0) {
      throw new Error('No info entrypoint found in package.json')
    }

    const metaEntrypoint = resolve(JSON.parse(packageJSON), './metadata.json')
    if (!metaEntrypoint || !Array.isArray(metaEntrypoint) || metaEntrypoint.length === 0) {
      throw new Error('No meta entrypoint found in package.json')
    }

    const iconsEntrypoint = resolve(JSON.parse(packageJSON), './icons.json')
    if (!iconsEntrypoint || !Array.isArray(iconsEntrypoint) || iconsEntrypoint.length === 0) {
      throw new Error('No icons entrypoint found in package.json')
    }

    iconifyJSONInfo.value = await loadFromPackage<IconifyInfo>(iconifyJSONPackageId.value, 'unpkg', { file: normalizePath(infoEntrypoint[0]), version: 'latest', asJSON: true })
    iconifyJSONMeta.value = await loadFromPackage<IconifyMetaData>(iconifyJSONPackageId.value, 'unpkg', { file: normalizePath(metaEntrypoint[0]), version: 'latest', asJSON: true })
    iconifyJSONIcons.value = await loadFromPackage<IconifyJSON>(iconifyJSONPackageId.value, 'unpkg', { file: normalizePath(iconsEntrypoint[0]), version: 'latest', asJSON: true })
  }
  catch (err) {
    console.error('Error loading Iconify JSON package:', err)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div flex flex-col gap-2 relative h-full>
    <div w-full flex flex-col gap-2 h-full max-w-100dvw overflow-x-scroll>
      <template v-if="loading">
        <div class="loader">
          Loading...
        </div>
      </template>
      <template v-else>
        <div>{{ iconifyJSONPackageId }} ({{ iconifyJSONInfo?.name }})</div>
        <div w-full flex flex-wrap gap-2>
          <template v-if="iconifyJSONIcons && iconifyJSONIcons.icons">
            <div
              v-for="(name, index) of Object.keys(iconifyJSONIcons.icons).slice(20, 40)" :key="index"
              w-fit p-2
              bg="hover:neutral-100 hover:dark:neutral-700"
              transition="all duration-150 ease-in-out"
              rounded="md" cursor-pointer
            >
              <IconifyIconRender :name="name" :icons="iconifyJSONIcons" text="[32px]" />
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
