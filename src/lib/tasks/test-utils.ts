import type { StorageLike } from './storage'

/** In-memory замена localStorage для тестов. */
export function createMemoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, String(value))
    },
  }
  return { storage, data }
}

/** Хранилище, которое бросает на любой доступ (приватный режим, квота). */
export function createThrowingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error('SecurityError')
    },
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
}
