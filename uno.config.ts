import type { PresetOrFactoryAwaitable } from 'unocss'

import { defineConfig, mergeConfigs, presetAttributify, presetIcons, presetTypography, presetWebFonts, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss'
import { presetScrollbar } from 'unocss-preset-scrollbar'

function createColorSchemeConfig(hueOffset = 0) {
  return {
    DEFAULT: `oklch(62% var(--theme-colors-chroma) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    50: `color-mix(in srgb, oklch(95% var(--theme-colors-chroma-50) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha) 30%, oklch(100% 0 360 / %alpha))`,
    100: `color-mix(in srgb, oklch(95% var(--theme-colors-chroma-100) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha) 80%, oklch(100% 0 360 / %alpha))`,
    200: `oklch(90% var(--theme-colors-chroma-200) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    300: `oklch(85% var(--theme-colors-chroma-300) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    400: `oklch(74% var(--theme-colors-chroma-400) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    500: `oklch(62% var(--theme-colors-chroma) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    600: `oklch(54% var(--theme-colors-chroma-600) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    700: `oklch(49% var(--theme-colors-chroma-700) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    800: `oklch(42% var(--theme-colors-chroma-800) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    900: `oklch(37% var(--theme-colors-chroma-900) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    950: `oklch(29% var(--theme-colors-chroma-950) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
  }
}

export function presetStoryMockHover(): PresetOrFactoryAwaitable {
  return {
    name: 'story-mock-hover',
    variants: [
      (matcher) => {
        if (!matcher.includes('hover')) {
          return matcher
        }

        return {
          matcher,
          selector: (s) => {
            return `${s}, ${s.replace(/:hover$/, '')}._hover`
          },
        }
      },
    ],
  }
}

export function safelistAllPrimaryBackgrounds(): string[] {
  return [
    ...[undefined, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => {
      const prefix = shade ? `bg-primary-${shade}` : `bg-primary`
      return [
        prefix,
        ...[5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(opacity => `${prefix}/${opacity}`),
      ]
    }).flat(),
  ]
}

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
      presetIcons({
        scale: 1.2,
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
    theme: {
      colors: {
        primary: createColorSchemeConfig(),
        complementary: createColorSchemeConfig(180),
      },
    },
  })
}

export default mergeConfigs([
  sharedUnoConfig(),
])
