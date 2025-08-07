<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { RouterView } from 'vue-router'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <div mx-auto h-full flex flex-col gap-2 w-full>
    <div grid="~ cols-[1fr_1fr_1fr]" h="56px" px-4 py-4 w-full bg="neutral-100 dark:neutral-900" fixed top-0 z-5>
      <div w-full />
      <div w-full text-center text-nowrap>
        Iconify Inspector
      </div>
      <div flex justify-end gap-2>
        <a href="https://github.com/nekomeowww/iconify-inspector" decoration-none outline-none>
          <div
            i-simple-icons:github
            transition="all duration-300 ease-in-out"
            class="text-primary"
          />
        </a>
        <button text-lg outline-none @click="() => toggleDark()">
          <div
            v-if="isDark"
            i-solar:moon-stars-bold-duotone
            transition="all duration-300 ease-in-out"
            text-primary
          />
          <div
            v-else
            i-solar:sun-bold
            transition="all duration-300 ease-in-out"
            text-primary
          />
        </button>
      </div>
    </div>
    <div flex-1 w-full p-5 overflow-visible flex flex-col>
      <div h="56px" />
      <RouterView />
    </div>
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
}

html {
  transition: all 0.3s ease-in-out;
  background: white;
}

html.dark {
  color-scheme: dark;
  background: #212121;
}
</style>
