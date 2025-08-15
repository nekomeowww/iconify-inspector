<script setup lang="ts">
import type { IconifyInfo, IconifyJSON, IconifyJSONIconsData, IconifyMetaData } from '@iconify/types'
import type { PackageJSON } from '@package-json/types'

import { refDebounced, useClipboard } from '@vueuse/core'
import { useMotion } from '@vueuse/motion'
import { ofetch } from 'ofetch'
import { resolve } from 'resolve.exports'
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import IconifyIconDetail from '../../components/IconifyIconDetail.vue'
import IconifyIconRender from '../../components/IconifyIconRender.vue'
import PackageManagersInstall from '../../components/PackageManagersInstall.vue'

const pageTitleRef = ref<HTMLElement>()
const route = useRoute('/collection/[...id]')
const iconifyJSONPackageId = toRef(() => route.params.id)

const loading = ref(false)

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

const filterIconSearchTerm = ref<string>('')
const filterIconSearchTermDebounced = refDebounced<string>(filterIconSearchTerm, 500)
const filteredIcons = computed(() => {
  const result = Object.keys(iconifyJSONIcons.value.icons)
  return result.filter((name) => {
    if (!filterIconSearchTerm.value) {
      return true
    }

    return name.toLowerCase().includes(filterIconSearchTermDebounced.value.toLowerCase())
  })
})

const copied = ref(false)

function handleCopy(text: string) {
  copy(text)
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
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
        <div class="loader">
          Loading...
        </div>
      </template>
      <template v-else>
        <div w-full>
          <div inline-flex items-center gap-2>
            <div text-lg>
              {{ iconifyJSONInfo?.name }}
            </div>
            <div inline-flex items-center gap-2 text="neutral-500 dark:neutral-400">
              <template v-if="iconifyJSONPackageJSON.repository">
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
            {{ iconifyJSONInfo.author.name }}
          </div>
          <template v-if="iconifyJSONInfo.license.url">
            <a :href="iconifyJSONInfo.license.url">
              {{ iconifyJSONInfo.license.title }}
            </a>
          </template>
          <template v-else>
            {{ iconifyJSONInfo.license.title }}
          </template>
        </div>
        <div w-full>
          <label w-full flex overflow-visible>
            <input v-model="filterIconSearchTerm" type="search" appearance-none w-full outline-none rounded-lg my-2 px-3 py-2 class="focus:ring-2 ring-0" transition="all duration-250 ease-in-out" placeholder="Search icons...">
          </label>
        </div>
        <div w-full flex flex-wrap gap-2>
          <template v-if="iconifyJSONIcons && iconifyJSONIcons.icons">
            <IconifyIconDetail v-for="(name, index) of filteredIcons" :key="index">
              <div
                w-fit p-2
                bg="hover:neutral-100 hover:dark:neutral-700"
                transition="all duration-150 ease-in-out"
                rounded="md"
                cursor-pointer
              >
                <IconifyIconRender :name="name" :icons="iconifyJSONIcons" text="[20px] lg:[32px]" />
              </div>

              <template #content>
                <div w-full flex flex-col gap-6 py-1 px-2>
                  <IconifyIconRender :name="name" :icons="iconifyJSONIcons" text="[24px] lg:[32px]" />
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
          </template>
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
