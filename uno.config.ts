import { createExternalPackageIconLoader } from '@iconify/utils/lib/loader/external-pkg'
import {
  presetChromatic,
} from '@proj-airi/unocss-preset-chromatic'
import {
  defineConfig,
  mergeConfigs,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import {
  presetScrollbar,
} from 'unocss-preset-scrollbar'

export function sharedUnoConfig() {
  return defineConfig({
    presets: [
      presetWind3(),
      presetAttributify(),
      presetTypography(),
      presetWebFonts({
        fonts: {
          sans: 'DM Sans',
          serif: 'DM Serif Display',
          mono: 'DM Mono',
          cute: 'Kiwi Maru',
          cuteen: 'Sniglet',
          jura: 'Jura',
          gugi: 'Gugi',
          quicksand: 'Quicksand',
        },
        timeouts: {
          warning: 5000,
          failure: 10000,
        },
      }),
      presetChromatic({
        baseHue: 250,
        colors: {
          primary: 0,
          complementary: 180,
        },
      }),
      presetIcons({
        scale: 1.2,
        collections: {
          ...createExternalPackageIconLoader('@proj-airi/lobe-icons'),
          ...createExternalPackageIconLoader('@proj-airi/iconify-meteocons'),
        },
      }),
      presetScrollbar(),
    ],
    transformers: [
      transformerDirectives({
        applyVariable: ['--at-apply'],
      }),
      transformerVariantGroup(),
    ],
    safelist: [
      ...'prose prose-sm m-auto text-left'.split(' '),
      ...'i-lobe-icons:openai i-lobe-icons:gemini-color i-lobe-icons:deepseek-color i-lobe-icons:deepseek i-lobe-icons:claude'.split(' '),
      ...'i-iconify-meteocons:partly-cloudy-day-rain-fill i-iconify-meteocons:wind-beaufort-4-line i-iconify-meteocons:thunderstorms-night-fill-static'.split(' '),
    ],
    // hyoban/unocss-preset-shadcn: Use shadcn ui with UnoCSS
    // https://github.com/hyoban/unocss-preset-shadcn
    //
    // Thanks to
    // https://github.com/unovue/shadcn-vue/issues/34#issuecomment-2467318118
    // https://github.com/hyoban-template/shadcn-vue-unocss-starter
    //
    // By default, `.ts` and `.js` files are NOT extracted.
    // If you want to extract them, use the following configuration.
    // It's necessary to add the following configuration if you use shadcn-vue or shadcn-svelte.
    content: {
      pipeline: {
        include: [
          // the default
          /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
          // include js/ts files
          '(components|src)/**/*.{js,ts,vue}',
        ],
      },
    },
    rules: [
      [/^mask-\[(.*)\]$/, ([, suffix]) => ({ '-webkit-mask-image': suffix.replace(/_/g, ' ') })],
    ],
  })
}

export default mergeConfigs([
  sharedUnoConfig(),
])
