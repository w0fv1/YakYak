import {
  ColorMode,
  Hierarchical,
  PathSimplifyMode,
  vectorize,
} from '@neplex/vectorizer'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const input = resolve('public/favicon.png')
const output = resolve('public/favicon.svg')

const png = await readFile(input)
const svg = await vectorize(png, {
  colorMode: ColorMode.Color,
  hierarchical: Hierarchical.Stacked,
  mode: PathSimplifyMode.Spline,
  colorPrecision: 7,
  filterSpeckle: 12,
  layerDifference: 10,
  lengthThreshold: 8,
  maxIterations: 2,
  spliceThreshold: 45,
  cornerThreshold: 60,
  pathPrecision: 2,
})

const roundedSvg = addRoundedBackground(svg)

await writeFile(output, roundedSvg)
console.log(`Generated ${output} from ${input}`)

function addRoundedBackground(svg) {
  const width = Number(svg.match(/\bwidth="(\d+)"/)?.[1] ?? 1254)
  const height = Number(svg.match(/\bheight="(\d+)"/)?.[1] ?? width)
  const radius = Math.round(Math.min(width, height) * 0.14)
  const inner = svg
    .replace(/<\?xml[^>]*>\s*/i, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/^<svg\b[^>]*>\s*/i, '')
    .replace(/\s*<\/svg>\s*$/i, '')
    .replace(/^\s*<path\b(?=[^>]*fill="#FDFDFD")[\s\S]*?\/>\s*/i, '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated from public/favicon.png by scripts/generate-favicon-svg.mjs using @neplex/vectorizer / VTracer -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<defs>
<clipPath id="faviconClip">
<rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/>
</clipPath>
</defs>
<rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#ffffff"/>
<g clip-path="url(#faviconClip)">
${inner}
</g>
</svg>
`
}
