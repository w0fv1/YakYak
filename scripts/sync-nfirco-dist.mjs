import { cp, mkdir, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryDir = resolve(projectDir, '..', '..')
const sourceDir = resolve(projectDir, 'dist')
const gitmodulesPath = resolve(repositoryDir, '.gitmodules')
const resourcesRoot = resolve(repositoryDir, 'src', 'main', 'resources')

if (
  !existsSync(gitmodulesPath) ||
  !existsSync(resourcesRoot) ||
  !readFileSync(gitmodulesPath, 'utf8').includes('path = app/yakyak')
) {
  throw new Error(`YakYak is not inside an Nfirco repository: ${projectDir}`)
}

if (!existsSync(resolve(sourceDir, 'index.html'))) {
  throw new Error(`Build output does not exist: ${sourceDir}`)
}

const targets = [resolve(resourcesRoot, 'yakyak')]
const runtimeRoot = resolve(repositoryDir, 'build', 'resources', 'main')
if (existsSync(runtimeRoot)) {
  targets.push(resolve(runtimeRoot, 'yakyak'))
}

for (const targetDir of targets) {
  const targetRelativePath = relative(repositoryDir, targetDir)
  if (targetRelativePath.startsWith('..') || isAbsolute(targetRelativePath)) {
    throw new Error(`Target is outside repository: ${targetDir}`)
  }
  await rm(targetDir, { recursive: true, force: true })
  await mkdir(targetDir, { recursive: true })
  await cp(sourceDir, targetDir, { recursive: true, force: true })
  process.stdout.write(`Synced ${sourceDir} -> ${targetDir}\n`)
}
