import { defaultFillers, defaultFlow, defaultGuideState } from './defaults'
import { normalizeDuration } from './snapshots'
import type { AppSnapshot, FlowLine, ThemeMode } from './types'

const dbName = 'yakyak-db'
const dbVersion = 1
const appStoreName = 'app'
const snapshotKey = 'snapshot'
const fillerStorageKey = 'say-words-fillers'
const flowStorageKey = 'say-words-flow'
const durationStorageKey = 'say-words-duration'
const themeStorageKey = 'say-words-theme'

let databasePromise: Promise<IDBDatabase> | undefined

export function openDatabase() {
  databasePromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)

    request.onupgradeneeded = () => {
      request.result.createObjectStore(appStoreName)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return databasePromise
}

export async function readSnapshot() {
  const database = await openDatabase()

  return new Promise<AppSnapshot | null>((resolve, reject) => {
    const transaction = database.transaction(appStoreName, 'readonly')
    const store = transaction.objectStore(appStoreName)
    const request = store.get(snapshotKey)

    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

export async function writeSnapshot(snapshot: AppSnapshot) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(appStoreName, 'readwrite')
    const store = transaction.objectStore(appStoreName)
    const request = store.put(snapshot, snapshotKey)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function readLegacySnapshot(): AppSnapshot | null {
  const savedDurationValue = localStorage.getItem(durationStorageKey)
  const savedDuration = savedDurationValue === null ? NaN : Number(savedDurationValue)
  const savedTheme = localStorage.getItem(themeStorageKey) as ThemeMode | null
  const savedFillers = readStoredArray<string>(fillerStorageKey)
  const savedFlow = readStoredArray<FlowLine>(flowStorageKey)
  const hasSavedTheme = savedTheme === 'light' || savedTheme === 'dark'
  const hasSavedDuration = Number.isFinite(savedDuration)
  const hasSavedFillers = Array.isArray(savedFillers)
  const hasSavedFlow = Array.isArray(savedFlow)

  if (!hasSavedFillers && !hasSavedFlow && !hasSavedDuration && !hasSavedTheme) {
    return null
  }

  const nextFlow = hasSavedFlow ? savedFlow : defaultFlow

  return {
    duration: normalizeDuration(savedDuration),
    theme: savedTheme === 'light' ? 'light' : 'dark',
    fillerPhrases: hasSavedFillers ? savedFillers : [...defaultFillers],
    flowPhrases: nextFlow,
    visibleFlowIds: nextFlow.map((item) => item.id),
    guide: { ...defaultGuideState },
  }
}

export function clearLegacyStorage() {
  localStorage.removeItem(durationStorageKey)
  localStorage.removeItem(fillerStorageKey)
  localStorage.removeItem(flowStorageKey)
  localStorage.removeItem(themeStorageKey)
}

function readStoredArray<T>(key: string) {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T[]) : null
  } catch {
    return null
  }
}
