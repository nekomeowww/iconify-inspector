import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('production CSS includes layout and attributify utilities from Vue templates', async () => {
  const assetsDirectory = fileURLToPath(new URL('../apps/inspector/dist/assets/', import.meta.url))
  const files = await readdir(assetsDirectory)
  const stylesheets = await Promise.all(files
    .filter(file => file.endsWith('.css'))
    .map(file => readFile(`${assetsDirectory}/${file}`, 'utf8')))
  const css = stylesheets.join('').replace(/\s+/g, '')

  expect(css).toMatch(/\.flex(?=[,{])[^{}]*\{[^}]*display:flex[;}]/)
  expect(css).toMatch(/\[flex(?:="")?\][^{}]*\{[^}]*display:flex[;}]/)
  expect(css).toContain('font-size:64px')
})
