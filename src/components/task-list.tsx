'use client'

import { TaskItem } from '@/components/task-item'
import { CheckCheck, ListTodo, type LucideIcon } from '@/lib/icons'
import type { Filter, Task } from '@/lib/tasks/types'

type TaskListProps = {
  tasks: readonly Task[]
  totalCount: number
  filter: Filter
  hydrated: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

const SKELETON_WIDTHS = ['72%', '48%', '60%']

function TaskListSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-1">
      <span className="sr-only">Загружаем задачи…</span>
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} aria-hidden="true" className="flex items-center gap-3 py-2.5 pl-2">
          <div className="size-5 shrink-0 animate-pulse rounded-[6px] bg-muted" />
          <div className="h-3.5 animate-pulse rounded-md bg-muted" style={{ width }} />
        </div>
      ))}
    </div>
  )
}

type EmptyCopy = { icon: LucideIcon; title: string; text: string }

function getEmptyCopy(filter: Filter, totalCount: number): EmptyCopy {
  if (totalCount === 0) {
    return { icon: ListTodo, title: 'Задач пока нет', text: 'Добавь первую — она сохранится в этом браузере.' }
  }
  if (filter === 'active') {
    return { icon: CheckCheck, title: 'Всё сделано', text: 'Активных задач не осталось.' }
  }
  return { icon: CheckCheck, title: 'Пока ничего не готово', text: 'Отмеченные задачи появятся здесь.' }
}

function EmptyState({ icon: Icon, title, text }: EmptyCopy) {
  return (
    <div className="flex animate-task-in flex-col items-center gap-2 px-4 py-10 text-center">
      <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-figma-surface-secondary text-muted-foreground dark:bg-secondary">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <p className="ty-nav">{title}</p>
      <p className="ty-meta">{text}</p>
    </div>
  )
}

export function TaskList({ tasks, totalCount, filter, hydrated, onToggle, onRemove }: TaskListProps) {
  if (!hydrated) return <TaskListSkeleton />
  if (tasks.length === 0) return <EmptyState {...getEmptyCopy(filter, totalCount)} />

  return (
    <ul aria-label="Задачи" className="-mx-2 flex flex-col gap-0.5">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onRemove={onRemove} />
      ))}
    </ul>
  )
}
