<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  collection: {
    id: string
  }
}>()

type Manager = 'pnpm' | 'npm' | 'yarn' | 'bun'

const managers = ['pnpm', 'npm', 'yarn', 'bun'] as const
const selectedPackageManager = ref<Manager>('pnpm')

const icons = {
  npm: 'i-logos:npm-icon',
  pnpm: 'i-logos:pnpm',
  yarn: 'i-logos:yarn',
  bun: 'i-logos:bun',
}

function selectManager(packageName: Manager) {
  selectedPackageManager.value = packageName
}

const status = ref(false)

async function copyText() {
  const text = `${selectedPackageManager.value} ${selectedPackageManager.value !== 'npm' ? 'add' : 'i'} -D ${props.collection.id}`
  status.value = true

  setTimeout(() => {
    status.value = false
  }, 2000)

  if (text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {}
  }
  return false
}
</script>

<template>
  <div class="border-2 border-neutral-200 dark:border-neutral-700 rounded-xl w-fit min-w-full lg:min-w-100 mt1">
    <div flex="~ gap-4 items-center" class="px-2 lg:px-3 py-3 text-xs lg:text-base" border="b-2 neutral-300 dark:neutral-600">
      <label
        v-for="manager in managers" :key="manager"
        flex="~ items-center gap-2"
        :class="[manager === selectedPackageManager ? 'op100' : 'op25']"
        @change="selectManager(manager)"
      >
        <input type="radio" name="manager" :value="manager" hidden>
        <div :class="icons[manager]" />
        <div mt--1>{{ manager }}</div>
      </label>
    </div>

    <div flex="~ gap-2 items-center" class="px-2 lg:px-3 py-3 text-xs lg:text-base">
      <code flex-auto>
        <span style="color:#80A665;">{{ selectedPackageManager }}</span>
        <span style="color:#DBD7CAEE;" />
        <span style="color:#B8A965;">{{ selectedPackageManager !== 'npm' ? ' add ' : ' i ' }} -D </span>
        <span style="color:#DBD7CAEE;" /><span style="color:#DBD7CAEE;" />
        <span style="color:#C98A7D;">{{ props.collection.id }}</span>
      </code>
      <button outline-none text="neutral-500 dark:neutral-400" @click="copyText">
        <Transition name="fade-slide-x" mode="out-in">
          <div v-if="status" i-ph:check-bold />
          <div v-else i-ph:copy-bold />
        </Transition>
      </button>
    </div>
  </div>
</template>
