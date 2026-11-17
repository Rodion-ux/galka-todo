'use client'

import { useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import { TaskItem } from '@/components/task-item'
import type { Filter, Task } from '@/lib/tasks/types'

type TaskListProps = {
  tasks: readonly Task[]
  totalCount: number
  filter: Filter
  hydrated: boolean
  /** Идёт «Удалить выполненные»: выполненные строки схлопываются. */
  clearing: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

/** До чтения localStorage — тихие строки-заглушки, а не «Список пуст.» на долю секунды. */
function TaskListSkeleton() {
  return (
    <div role="status" className="flex flex-col">
      <span className="sr-only">Загружаем задачи…</span>
      {['58%', '42%', '50%'].map((width, i) => (
        <div key={width} aria-hidden="true" className="flex h-[52px] items-center gap-[15px] border-p-line not-first:border-t">
          <div className="size-[22px] shrink-0 rounded-full border-[1.5px] border-p-line" />
          <div className="h-2.5 rounded-[2px] bg-p-line" style={{ width, opacity: 1 - i * 0.2 }} />
        </div>
      ))}
    </div>
  )
}

/** Список монтируется заново при смене фильтра (key в TodoApp): он меняется мгновенно, без каскадов. */
function Tasks({ tasks, clearing, onToggle, onRemove }: Pick<TaskListProps, 'tasks' | 'clearing' | 'onToggle' | 'onRemove'>) {
  // Строки, что были при монтировании списка, не анимируются; смонтированные позже (добавление, undo) раскрываются.
  const [mountedAt] = useState(() => Date.now())

  return (
    <ul aria-label="Задачи" className="flex flex-col empty:hidden">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          listMountedAt={mountedAt}
          clearing={clearing && task.done}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}

export function TaskList({ tasks, totalCount, filter, hydrated, clearing, onToggle, onRemove }: TaskListProps) {
  if (!hydrated) return <TaskListSkeleton />
  // Пустой ul остаётся смонтированным: первая добавленная задача раскроется, а не появится скачком.
  return (
    <>
      {tasks.length === 0 && <EmptyState filter={filter} totalCount={totalCount} />}
      <Tasks tasks={tasks} clearing={clearing} onToggle={onToggle} onRemove={onRemove} />
    </>
  )
}
