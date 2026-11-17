'use client'

import { useSyncExternalStore } from 'react'
import { taskStore } from './store'

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
    remove: taskStore.remove,
    clearDone: taskStore.clearDone,
  }
}
