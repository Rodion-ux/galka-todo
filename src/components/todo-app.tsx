'use client'

import { useMemo, useState } from 'react'
import { TaskComposer } from '@/components/task-composer'
import { TaskFilters, type TaskCounts } from '@/components/task-filters'
import { TaskList } from '@/components/task-list'
import { TodayProgress } from '@/components/today-progress'
import { UndoToast } from '@/components/undo-toast'
import { useTasks } from '@/lib/tasks/use-tasks'
import type { Filter } from '@/lib/tasks/types'

export function TodoApp() {
  const { tasks, hydrated, add, toggle, remove, clearDone } = useTasks()
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo<TaskCounts>(() => {
    const done = tasks.filter((t) => t.done).length
    return { all: tasks.length, active: tasks.length - done, done }
  }, [tasks])

  const visible = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.done)
    if (filter === 'done') return tasks.filter((t) => t.done)
    return tasks
  }, [tasks, filter])

  const hasTasks = hydrated && counts.all > 0

  return (
    <div className="mt-7 flex flex-col gap-6">
      {hasTasks && <TodayProgress done={counts.done} total={counts.all} />}
      <TaskComposer onAdd={add} />
      {hasTasks && (
        <TaskFilters filter={filter} counts={counts} onFilterChange={setFilter} onClearDone={clearDone} />
      )}
      <div className="-mt-1">
        <TaskList
          key={filter}
          tasks={visible}
          totalCount={counts.all}
          filter={filter}
          hydrated={hydrated}
          onToggle={toggle}
          onRemove={remove}
        />
      </div>
      <UndoToast />
    </div>
  )
}
