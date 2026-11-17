'use client'

import { useMemo, useState } from 'react'
import { TaskComposer } from '@/components/task-composer'
import { TaskFilters, type TaskCounts } from '@/components/task-filters'
import { TaskList } from '@/components/task-list'
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

  return (
    <div className="flex flex-col gap-4">
      <TaskComposer onAdd={add} />
      {hydrated && counts.all > 0 && (
        <TaskFilters filter={filter} counts={counts} onFilterChange={setFilter} onClearDone={clearDone} />
      )}
      <TaskList
        tasks={visible}
        totalCount={counts.all}
        filter={filter}
        hydrated={hydrated}
        onToggle={toggle}
        onRemove={remove}
      />
    </div>
  )
}
