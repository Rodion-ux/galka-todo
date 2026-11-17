'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClearDoneButton } from '@/components/clear-done-button'
import { ProgressCounter } from '@/components/progress-counter'
import { COMPOSER_INPUT_ID, TaskComposer } from '@/components/task-composer'
import { TaskFilters } from '@/components/task-filters'
import { TaskList } from '@/components/task-list'
import { UndoToast } from '@/components/undo-toast'
import { ROW_EXIT_MS, prefersReducedMotion } from '@/lib/motion'
import { useTasks } from '@/lib/tasks/use-tasks'
import type { Filter } from '@/lib/tasks/types'

export function TodoApp() {
  const { tasks, hydrated, add, toggle, remove, clearDone } = useTasks()
  const [filter, setFilter] = useState<Filter>('all')
  const [clearing, setClearing] = useState(false)

  const doneCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks])

  const visible = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.done)
    if (filter === 'done') return tasks.filter((t) => t.done)
    return tasks
  }, [tasks, filter])

  // Сначала выполненные строки схлопываются, потом уходят из стора одним действием (один тост, один undo).
  useEffect(() => {
    if (!clearing) return
    const timer = window.setTimeout(() => {
      clearDone()
      setClearing(false)
    }, ROW_EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [clearing, clearDone])

  function handleClearDone() {
    // Кнопка сейчас исчезнет — фокус в поле ввода, а не в никуда.
    document.getElementById(COMPOSER_INPUT_ID)?.focus()
    if (prefersReducedMotion()) clearDone()
    else setClearing(true)
  }

  const hasTasks = hydrated && tasks.length > 0

  return (
    <div className="flex flex-col">
      <div className="mt-8 sm:mt-12">
        {hydrated ? (
          <ProgressCounter done={doneCount} total={tasks.length} />
        ) : (
          <div aria-hidden="true" className="h-[92px] sm:h-[114px]" />
        )}
      </div>
      <div className="mt-7 sm:mt-10">
        <TaskComposer onAdd={add} />
      </div>
      {hasTasks && (
        <div className="mt-6">
          <TaskFilters filter={filter} onFilterChange={setFilter} />
        </div>
      )}
      <div className="mt-2">
        <TaskList
          key={filter}
          tasks={visible}
          totalCount={tasks.length}
          filter={filter}
          hydrated={hydrated}
          clearing={clearing}
          onToggle={toggle}
          onRemove={remove}
        />
      </div>
      {doneCount > 0 && !clearing && (
        <div className="mt-4 flex justify-end">
          <ClearDoneButton count={doneCount} onClear={handleClearDone} />
        </div>
      )}
      <UndoToast />
    </div>
  )
}
