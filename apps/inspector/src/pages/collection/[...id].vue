<script setup lang="ts">
import type { IconifyInfo, IconifyJSON, IconifyJSONIconsData, IconifyMetaData } from '@iconify/types'
import type { PackageJSON } from '@package-json/types'

import spinnerIcons from '@iconify-json/svg-spinners/icons.json'
import { refDebounced, useClipboard, useResizeObserver } from '@vueuse/core'
import { useMotion } from '@vueuse/motion'
import { ofetch } from 'ofetch'
import { resolve } from 'resolve.exports'
import { VList } from 'virtua/vue'
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import IconifyIconDetail from '../../components/IconifyIconDetail.vue'
import IconifyIconRender from '../../components/IconifyIconRender.vue'
import PackageManagersInstall from '../../components/PackageManagersInstall.vue'
import { buildVariants } from '../../utils/variants'

const pageTitleRef = ref<HTMLElement>()
const route = useRoute('/collection/[...id]')
const iconifyJSONPackageId = toRef(() => route.params.id)

const loading = ref(false)
const spinnerIconsJSON = spinnerIcons as IconifyJSON

const { copy } = useClipboard()
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

const iconifyJSONPackageJSON = ref<PackageJSON>()
const iconifyJSONInfo = ref<IconifyInfo>()
const iconifyJSONIcons = ref<IconifyJSONIconsData>()
const iconifyJSONMeta = ref<IconifyMetaData>()
const iconifyJSONVariants = ref<Record<string, string[]> | undefined>()

const selectedCategory = ref('')
const selectedVariant = ref('')

const categories = computed(() => iconifyJSONMeta.value?.categories ?? {})
const variants = computed(() => iconifyJSONVariants.value ?? {})
const iconNames = computed(() => iconifyJSONIcons.value?.icons ? Object.keys(iconifyJSONIcons.value.icons) : [])
const filterIconSearchTerm = ref<string>('')
const filterIconSearchTermDebounced = refDebounced<string>(filterIconSearchTerm, 500)
const listContainerRef = ref<HTMLElement>()
const containerWidth = ref(0)

useResizeObserver(listContainerRef, (entries) => {
  const entry = entries[0]
  if (!entry)
    return
  containerWidth.value = entry.contentRect.width
})

const iconPool = computed(() => {
  let pool = iconNames.value

  if (selectedCategory.value) {
    const categoryIcons = categories.value?.[selectedCategory.value]
    pool = categoryIcons ?? []
  }

  if (selectedVariant.value) {
    const variantIcons = variants.value?.[selectedVariant.value] ?? []
    pool = pool.filter(icon => variantIcons.includes(icon))
  }

  return pool
})

const filteredIcons = computed(() => {
  if (!filterIconSearchTermDebounced.value)
    return iconPool.value

  const term = filterIconSearchTermDebounced.value.toLowerCase()
  return iconPool.value.filter(name => name.toLowerCase().includes(term))
})
const iconWidths = computed<Record<string, number>>(() => {
  const result: Record<string, number> = {}
  const iconSet = iconifyJSONIcons.value
  if (!iconSet?.icons)
    return result
  const iconFontPx = 64 // matches text=\"[64px]\" used in grid tiles
  const paddingPx = 16 // p-2 on both sides
  const defaultWidth = iconSet.width || 24
  const defaultHeight = iconSet.height || 24
  for (const name of Object.keys(iconSet.icons)) {
    const icon = iconSet.icons[name] as any
    const w = icon.width ?? defaultWidth
    const h = icon.height ?? defaultHeight
    const ratio = h ? w / h : 1
    result[name] = (ratio * iconFontPx) + paddingPx
  }
  return result
})
const virtualRows = computed(() => {
  const rows: string[][] = []
  const list = filteredIcons.value
  const available = containerWidth.value || 120
  let currentRow: string[] = []
  let widthSoFar = 0
  for (const name of list) {
    const itemWidth = iconWidths.value[name] ?? 120
    if (widthSoFar + itemWidth > available && currentRow.length) {
      rows.push(currentRow)
      currentRow = []
      widthSoFar = 0
    }
    currentRow.push(name)
    widthSoFar += itemWidth
  }
  if (currentRow.length)
    rows.push(currentRow)
  return rows
})

const copied = ref(false)

function handleCopy(text: string) {
  copy(text)
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function toggleCategory(category: string) {
  selectedCategory.value = selectedCategory.value === category ? '' : category
}

function toggleVariant(variant: string) {
  selectedVariant.value = selectedVariant.value === variant ? '' : variant
}

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
  selectedCategory.value = ''
  selectedVariant.value = ''
  filterIconSearchTerm.value = ''
  iconifyJSONVariants.value = undefined

  loading.value = true

  try {
    const packageJSON = await resolvePackageJSON(iconifyJSONPackageId.value, 'unpkg')
    iconifyJSONPackageJSON.value = JSON.parse(packageJSON) as PackageJSON

    const infoEntrypoint = resolve(iconifyJSONPackageJSON.value, './info.json')
    if (!infoEntrypoint || !Array.isArray(infoEntrypoint) || infoEntrypoint.length === 0) {
      throw new Error('No info entrypoint found in package.json')
    }

    const metaEntrypoint = resolve(iconifyJSONPackageJSON.value, './metadata.json')
    if (!metaEntrypoint || !Array.isArray(metaEntrypoint) || metaEntrypoint.length === 0) {
      throw new Error('No meta entrypoint found in package.json')
    }

    const iconsEntrypoint = resolve(iconifyJSONPackageJSON.value, './icons.json')
    if (!iconsEntrypoint || !Array.isArray(iconsEntrypoint) || iconsEntrypoint.length === 0) {
      throw new Error('No icons entrypoint found in package.json')
    }

    iconifyJSONInfo.value = await loadFromPackage<IconifyInfo>(iconifyJSONPackageId.value, 'unpkg', { file: normalizePath(infoEntrypoint[0]), version: 'latest', asJSON: true })
    iconifyJSONMeta.value = await loadFromPackage<IconifyMetaData>(iconifyJSONPackageId.value, 'unpkg', { file: normalizePath(metaEntrypoint[0]), version: 'latest', asJSON: true })
    iconifyJSONIcons.value = await loadFromPackage<IconifyJSON>(iconifyJSONPackageId.value, 'unpkg', { file: normalizePath(iconsEntrypoint[0]), version: 'latest', asJSON: true })

    iconifyJSONVariants.value = buildVariants(iconifyJSONPackageId.value, iconifyJSONIcons.value?.icons)
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
    <div w-full flex flex-col gap-2 h-full max-w-100dvw>
      <template v-if="loading">
        <div class="flex flex-col items-center justify-center gap-3 min-h-80 h-full text-neutral-600 dark:text-neutral-200">
          <IconifyIconRender name="ring-resize" :icons="spinnerIconsJSON" text="[64px]" />
          <div text-sm font-medium>
            Loading collection...
          </div>
        </div>
      </template>
      <template v-else>
        <div w-full flex flex-col gap-1>
          <div inline-flex items-center gap-2>
            <div text-lg>
              {{ iconifyJSONInfo?.name }}
            </div>
            <div inline-flex items-center gap-2 text="neutral-500 dark:neutral-400">
              <template v-if="iconifyJSONPackageJSON?.repository">
                <template v-if="typeof iconifyJSONPackageJSON.repository === 'string'">
                  <a :href="iconifyJSONPackageJSON.repository" target="_blank">
                    <div i-ph:link-simple />
                  </a>
                </template>
                <template v-else-if="typeof iconifyJSONPackageJSON.repository === 'object' && iconifyJSONPackageJSON.repository.url">
                  <a :href="iconifyJSONPackageJSON.repository.url" target="_blank">
                    <div i-ph:link-simple />
                  </a>
                </template>
              </template>
              <a :href="`https://www.npmjs.com/package/${iconifyJSONPackageId}`" target="_blank">
                <div i-simple-icons:npm />
              </a>
            </div>
          </div>
          <div text="neutral-500 dark:neutral-400">
            {{ iconifyJSONInfo?.author?.name || 'Unknown author' }}
          </div>
          <template v-if="iconifyJSONInfo?.license?.url">
            <a :href="iconifyJSONInfo.license.url">
              {{ iconifyJSONInfo.license.title }}
            </a>
          </template>
          <template v-else-if="iconifyJSONInfo?.license?.title">
            {{ iconifyJSONInfo.license.title }}
          </template>
        </div>
        <div w-full>
          <label w-full flex overflow-visible>
            <input v-model="filterIconSearchTerm" type="search" appearance-none w-full outline-none rounded-lg my-2 px-3 py-2 class="focus:ring-2 ring-0" bg="neutral-100 dark:neutral-900" transition="all duration-250 ease-in-out" placeholder="Search icons or variants...">
          </label>
        </div>
        <div v-if="Object.keys(categories).length" w-full flex="~ wrap gap-2 items-center" text-sm>
          <div op50>
            Categories
          </div>
          <button
            v-for="categoryName in Object.keys(categories)"
            :key="categoryName"
            class="px-3 py-1 border border-neutral-300 dark:border-neutral-700 rounded-full transition-colors duration-150"
            :class="selectedCategory === categoryName ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            type="button"
            @click="toggleCategory(categoryName)"
          >
            {{ categoryName }}
          </button>
        </div>
        <div v-if="Object.keys(variants).length" w-full flex="~ wrap gap-2 items-center" text-sm>
          <div op50>
            Variants
          </div>
          <button
            v-for="variantName in Object.keys(variants)"
            :key="variantName"
            class="px-3 py-1 border-2 border-neutral-200 dark:border-neutral-800 rounded-full transition-colors duration-150 text-xs"
            :class="selectedVariant === variantName ? 'bg-primary text-white border-primary' : 'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            type="button"
            @click="toggleVariant(variantName)"
          >
            {{ variantName }}
          </button>
        </div>
        <div
          v-if="iconifyJSONIcons && iconifyJSONIcons.icons"
          ref="listContainerRef"
          w-full
          class="flex-1 min-h-80"
        >
          <VList
            :data="virtualRows"
            :style="{ height: '80vh' }"
            :buffer-size="200"
            class="overflow-auto"
          >
            <template #default="{ item: row, index: rowIndex }">
              <div class="flex gap-1 w-full flex-nowrap">
                <IconifyIconDetail v-for="(name, index) of row" :key="name + index + rowIndex">
                  <div
                    w-fit p-2
                    bg="hover:neutral-100 hover:dark:neutral-700"
                    transition="all duration-150 ease-in-out"
                    rounded="md"
                    cursor-pointer
                  >
                    <IconifyIconRender :name="name" :icons="iconifyJSONIcons" text="[64px] lg:[72px]" />
                  </div>

                  <template #content>
                    <div w-full flex flex-col gap-6 py-1 px-2>
                      <IconifyIconRender :name="name" :icons="iconifyJSONIcons" text="[64px] lg:[72px]" />
                      <div>
                        <div text="neutral-500 dark:neutral-400" flex items-center gap-2>
                          <div font-mono>
                            {{ iconifyJSONIcons.prefix }}:{{ name }}
                          </div>
                          <button outline-none @click="handleCopy(`${iconifyJSONIcons.prefix}:${name}`)">
                            <Transition name="fade-slide-x" mode="out-in">
                              <div v-if="copied" i-ph:check-bold />
                              <div v-else i-ph:copy-bold />
                            </Transition>
                          </button>
                        </div>
                      </div>
                      <PackageManagersInstall :collection="{ id: iconifyJSONPackageId }" />
                    </div>
                  </template>
                </IconifyIconDetail>
              </div>
            </template>
          </VList>
          <div v-if="!filteredIcons.length" class="text-neutral-500 dark:text-neutral-400">
            No icons match the current filters.
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style>
.fade-slide-x-enter-active,
.fade-slide-x-leave-active {
  transition: all 0.25s ease-in-out;
}

.fade-slide-x-enter-from,
.fade-slide-x-leave-to {
  opacity: 0;
  transform: translateX(4px);
}

.fade-slide-x-enter-to,
.fade-slide-x-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
