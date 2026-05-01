import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

function normalizeBase(value: string | undefined) {
  if (!value) return './'

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.endsWith('/') ? value : `${value}/`
  }

  if (value === './' || value === '') return './'

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: normalizeBase(process.env.YAKYAK_BASE_URL ?? process.env.BASE_URL),
  plugins: [tailwindcss(), svelte()],
})
