import {
  STORAGE_KEY,
  getBrowserStorage,
  loadTasks,
  normalizeTitle,
  saveTasks,
  type StorageLike,
} from './storage'
import type { Task } from './types'

export type TasksState = {
  readonly tasks: readonly Task[]
  /** false, пока стор не прочитал хранилище (SSR и первый клиентский рендер). */
  readonly hydrated: boolean
}

/** Удалённая задача с прежней позицией — для undo. */
export type RemovedEntry = {
  readonly task: Task
  /** Индекс в списке до удаления. */
  readonly index: number
  /** id задачи, стоявшей прямо перед ней (null — была первой). */
  readonly prevId: string | null
}

type Listener = () => void
type EventTargetLike = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>

export type TaskStoreOptions = {
  /** Источник хранилища; вызывается лениво при первой загрузке. */
  getStorage?: () => StorageLike | null
  /** Куда подписываться на событие storage (синк вкладок). */
  getEventTarget?: () => EventTargetLike | null
  now?: () => number
  createId?: () => string
}

export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // randomUUID недоступен вне secure context — падаем на фолбэк
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const SERVER_STATE: TasksState = Object.freeze({ tasks: Object.freeze([]), hydrated: false })

export function createTaskStore(options: TaskStoreOptions = {}) {
  const {
    getStorage = getBrowserStorage,
    getEventTarget = () => (typeof window === 'undefined' ? null : window),
    now = Date.now,
    createId: makeId = createId,
  } = options

  let state: TasksState = SERVER_STATE
  let storage: StorageLike | null = null
  const listeners = new Set<Listener>()

  function emit() {
    for (const listener of listeners) listener()
  }

  function setTasks(tasks: readonly Task[], persist: boolean) {
    state = { tasks, hydrated: true }
    if (persist) saveTasks(storage, tasks)
    emit()
  }

  /** Ленивое чтение хранилища. Повторные вызовы — no-op. */
  function hydrate() {
    if (state.hydrated) return
    storage = getStorage()
    setTasks(loadTasks(storage), false)
  }

  function onStorage(event: Event) {
    const key = (event as StorageEvent).key
    // key === null — другая вкладка вызвала localStorage.clear()
    if (!storage || (key !== STORAGE_KEY && key !== null)) return
    setTasks(loadTasks(storage), false)
  }

  function subscribe(listener: Listener) {
    listeners.add(listener)
    if (listeners.size === 1) getEventTarget()?.addEventListener('storage', onStorage)
    hydrate()
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) getEventTarget()?.removeEventListener('storage', onStorage)
    }
  }

  /** Экшены всегда работают поверх загруженных данных, чтобы не затереть storage пустым списком. */
  function update(next: (tasks: readonly Task[]) => readonly Task[]) {
    hydrate()
    const tasks = next(state.tasks)
    if (tasks !== state.tasks) setTasks(tasks, true)
  }

  function add(rawTitle: string): Task | null {
    const title = normalizeTitle(rawTitle)
    if (title.length === 0) return null
    const task: Task = { id: makeId(), title, done: false, createdAt: now() }
    update((tasks) => [task, ...tasks])
    return task
  }

  function toggle(id: string) {
    update((tasks) =>
      tasks.some((t) => t.id === id)
        ? tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
        : tasks,
    )
  }

  /** Убирает задачи по предикату и возвращает их с позициями (для undo). */
  function removeWhere(predicate: (task: Task) => boolean): RemovedEntry[] {
    const removed: RemovedEntry[] = []
    update((tasks) => {
      tasks.forEach((task, index) => {
        if (predicate(task)) removed.push({ task, index, prevId: index > 0 ? tasks[index - 1].id : null })
      })
      return removed.length > 0 ? tasks.filter((t) => !predicate(t)) : tasks
    })
    return removed
  }

  function remove(id: string): RemovedEntry[] {
    return removeWhere((t) => t.id === id)
  }

  function clearDone(): RemovedEntry[] {
    return removeWhere((t) => t.done)
  }

  /**
   * Undo: возвращает задачи на прежние места и с прежним статусом.
   * Ставит задачу сразу за прежним соседом (если он ещё есть), иначе — на прежний
   * индекс. Задачи, которые уже есть в списке (например, вернула другая вкладка), пропускаются.
   */
  function restore(entries: readonly RemovedEntry[]) {
    update((tasks) => {
      const present = new Set(tasks.map((t) => t.id))
      const pending = [...entries].sort((a, b) => a.index - b.index).filter((e) => !present.has(e.task.id))
      if (pending.length === 0) return tasks
      const next = [...tasks]
      for (const { task, index, prevId } of pending) {
        const prevAt = prevId === null ? -1 : next.findIndex((t) => t.id === prevId)
        const at = prevId === null ? 0 : prevAt >= 0 ? prevAt + 1 : Math.min(index, next.length)
        next.splice(at, 0, task)
        present.add(task.id)
      }
      return next
    })
  }

  return {
    subscribe,
    getSnapshot: () => state,
    getServerSnapshot: () => SERVER_STATE,
    hydrate,
    add,
    toggle,
    remove,
    clearDone,
    restore,
  }
}

export type TaskStore = ReturnType<typeof createTaskStore>

/** Единственный стор приложения. */
export const taskStore = createTaskStore()
