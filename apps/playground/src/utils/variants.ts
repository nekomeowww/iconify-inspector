import type { IconifyJSON } from '@iconify/types'

export type VariantMap = Record<string, string[]>

type VariantRule = [string, string | RegExp]

// Explicit rules for sets we care about so we get predictable groups.
const explicitVariantRules: Record<string, VariantRule[]> = {
  '@proj-airi/lobe-icons': [
    ['Color', '-color'],
    ['Text', '-text'],
    ['Brand', '-brand'],
  ],
  '@proj-airi/iconify-meteocons': [
    ['Fill', '-fill'],
    ['Line', '-line'],
  ],
}

// Fallback suffixes that commonly indicate variants across Iconify sets.
const fallbackVariantRules: VariantRule[] = [
  ['Filled', /-fill(ed)?$/],
  ['Outline', /-outline$/],
  ['Line', /-line$/],
  ['Duotone', /-duotone$/],
  ['Bold', /-bold$/],
  ['Light', /-light$/],
  ['Thin', /-thin$/],
  ['Regular', /-regular$/],
  ['Solid', /-solid$/],
  ['Round', /-round(ed)?$/],
  ['Color', /-color$/],
  ['Text', /-text$/],
]

function matches(rule: VariantRule, icon: string) {
  const [, pattern] = rule
  return typeof pattern === 'string'
    ? icon.endsWith(pattern)
    : pattern.test(icon)
}

export function buildVariants(collectionId: string, icons: IconifyJSON['icons'] | undefined): VariantMap | undefined {
  if (!icons)
    return

  const iconNames = Object.keys(icons)
  const rules = explicitVariantRules[collectionId]
    ?? fallbackVariantRules.filter(rule => iconNames.some(name => matches(rule, name)))

  if (!rules.length)
    return

  const variants: VariantMap = {}
  for (const icon of iconNames) {
    const rule = rules.find(r => matches(r, icon))
    const group = rule ? rule[0] : 'Default'
    variants[group] ||= []
    variants[group].push(icon)
  }

  const buckets = Object.keys(variants)
  if (buckets.length <= 1 && buckets[0] === 'Default')
    return

  return variants
}
