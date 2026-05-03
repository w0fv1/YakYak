export function makeId(prefix: string, index = Date.now()) {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 7)}`
}
