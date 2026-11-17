import { taskStore, type RemovedEntry } from './store'

/** Последнее отменяемое действие — то, что показывает тост «Вернуть». */
export type UndoEntry = {
  /** Растёт с каждым действием: новый тост заменяет старый. */
  readonly key: number
  readonly message: string
  readonly entries: readonly RemovedEntry[]
}

type Listener = () => void

/**
 * Хранит только последнее удаление. Undo действует для него одного:
 * новое действие вытесняет старое (как в брифе: «новый тост заменяет старый»).
 */
export function createUndoStore(restore: (entries: readonly RemovedEntry[]) => void) {
  let current: UndoEntry | null = null
  let seq = 0
  const listeners = new Set<Listener>()

  function set(next: UndoEntry | null) {
    current = next
    for (const listener of listeners) listener()
  }

  /** Запоминает удаление. Пустой список (ничего не удалили) тост не показывает. */
  function push(message: string, entries: readonly RemovedEntry[]) {
    if (entries.length === 0) return
    set({ key: ++seq, message, entries })
  }

  /** Возвращает задачи; key защищает от отмены уже вытесненного действия. */
  function undo(key?: number): readonly RemovedEntry[] {
    if (!current || (key !== undefined && key !== current.key)) return []
    const { entries } = current
    set(null)
    restore(entries)
    return entries
  }

  function dismiss(key?: number) {
    if (!current || (key !== undefined && key !== current.key)) return
    set(null)
  }

  return {
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => current,
    getServerSnapshot: () => null,
    push,
    undo,
    dismiss,
  }
}

export type UndoStore = ReturnType<typeof createUndoStore>

export const undoStore = createUndoStore(taskStore.restore)
