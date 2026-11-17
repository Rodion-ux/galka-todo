import { TITLE_MAX_LENGTH, type StoredTasks, type Task } from './types'

export const STORAGE_KEY = 'galka:tasks:v1'

/** Минимальный интерфейс хранилища — localStorage или фейк в тестах. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/**
 * localStorage, если он доступен. Само обращение к window.localStorage
 * может бросить SecurityError (приватный режим, запрет cookies) → null.
 */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null
    const storage = window.localStorage
    return storage ?? null
  } catch {
    return null
  }
}

/** Приводит заголовок к норме: trim, обрезка до лимита. Пустой → ''. */
export function normalizeTitle(raw: string): string {
  return raw.trim().slice(0, TITLE_MAX_LENGTH).trimEnd()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Проверяет один элемент из хранилища; невалидный → null. */
export function sanitizeTask(value: unknown): Task | null {
  if (!isRecord(value)) return null
  const { id, title, done, createdAt } = value
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof title !== 'string') return null
  if (typeof done !== 'boolean') return null
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) return null
  const normalized = normalizeTitle(title)
  if (normalized.length === 0) return null
  return { id, title: normalized, done, createdAt }
}

/**
 * Разбирает сырую строку из хранилища. Битый JSON, чужой формат или другая
 * версия → []. Невалидные элементы и дубли id отбрасываются поштучно.
 */
export function parseTasks(raw: string | null): Task[] {
  if (raw == null || raw === '') return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.tasks)) return []

  const seen = new Set<string>()
  const tasks: Task[] = []
  for (const item of data.tasks) {
    const task = sanitizeTask(item)
    if (!task || seen.has(task.id)) continue
    seen.add(task.id)
    tasks.push(task)
  }
  return tasks
}

export function serializeTasks(tasks: readonly Task[]): string {
  const payload: StoredTasks = { version: 1, tasks: [...tasks] }
  return JSON.stringify(payload)
}

/** Читает задачи; любые ошибки доступа → []. */
export function loadTasks(storage: StorageLike | null): Task[] {
  if (!storage) return []
  try {
    return parseTasks(storage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

/** Пишет задачи; при ошибке (квота, запрет) возвращает false, не бросает. */
export function saveTasks(storage: StorageLike | null, tasks: readonly Task[]): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, serializeTasks(tasks))
    return true
  } catch {
    return false
  }
}
