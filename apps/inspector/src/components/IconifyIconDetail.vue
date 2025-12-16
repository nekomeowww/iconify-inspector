<script setup lang="ts">
import { DrawerContent, DrawerHandle, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTrigger } from 'vaul-vue'
</script>

<template>
  <DrawerRoot should-scale-background>
    <DrawerTrigger as-child>
      <div w-fit>
        <slot />
      </div>
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay class="fixed bg-black/40 inset-0" />
      <DrawerContent class="flex flex-col rounded-t-[10px] h-full mt-24 max-h-[60%] lg:max-h-[30%] fixed bottom-0 left-0 right-0">
        <div class="px-2 py-2 bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-lg rounded-t-[10px] flex-1 outline-none border-none">
          <DrawerHandle data-testid="handle" class="mb-4 mt-2 block lg:hidden!" />
          <slot name="content" />
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
