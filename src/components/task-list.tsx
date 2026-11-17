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
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

const SKELETON_WIDTHS = ['62%', '44%', '54%']

function TaskListSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-1.5">
      <span className="sr-only">Загружаем задачи…</span>
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} aria-hidden="true" className="g-skeleton flex h-14 items-center gap-3 rounded-2xl bg-g-row px-4">
          <div className="size-[26px] shrink-0 rounded-full border-2 border-g-row-hover" />
          <div className="h-3.5 rounded-md bg-g-row-hover" style={{ width }} />
        </div>
      ))}
    </div>
  )
}

/** Список монтируется заново при смене фильтра (key в TodoApp): первые строки — каскадом, новые — «попом». */
function Tasks({ tasks, onToggle, onRemove }: Pick<TaskListProps, 'tasks' | 'onToggle' | 'onRemove'>) {
  // Строки, что были при монтировании списка, входят каскадом; всё, что смонтировалось позже
  // (добавление, undo), — «попом». Окно 100 мс покрывает первый коммит.
  const [mountedAt] = useState(() => Date.now())

  return (
    <ul aria-label="Задачи" className="flex flex-col empty:hidden">
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          listMountedAt={mountedAt}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}

export function TaskList({ tasks, totalCount, filter, hydrated, onToggle, onRemove }: TaskListProps) {
  if (!hydrated) return <TaskListSkeleton />
  // Пустой ul остаётся смонтированным: первая добавленная задача появится «попом», а не каскадом.
  return (
    <>
      {tasks.length === 0 && <EmptyState filter={filter} totalCount={totalCount} />}
      <Tasks tasks={tasks} onToggle={onToggle} onRemove={onRemove} />
    </>
  )
}
