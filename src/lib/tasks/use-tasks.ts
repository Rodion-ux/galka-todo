'use client'

import { useSyncExternalStore } from 'react'
import { taskStore } from './store'
import { undoStore } from './undo'

/** Удаление с undo: стор убирает задачу, undo-стор запоминает её для тоста «Вернуть». */
function remove(id: string) {
  undoStore.push('Задача удалена', taskStore.remove(id))
}

function clearDone() {
  const removed = taskStore.clearDone()
  undoStore.push(`Удалено: ${removed.length}`, removed)
}

export function useTasks() {
  const { tasks, hydrated } = useSyncExternalStore(
    taskStore.subscribe,
    taskStore.getSnapshot,
    taskStore.getServerSnapshot,
  )
  return {
    tasks,
    hydrated,
    add: taskStore.add,
    toggle: taskStore.toggle,
    remove,
    clearDone,
  }
}

export function useUndo() {
  const entry = useSyncExternalStore(undoStore.subscribe, undoStore.getSnapshot, undoStore.getServerSnapshot)
  return { entry, undo: undoStore.undo, dismiss: undoStore.dismiss }
}
