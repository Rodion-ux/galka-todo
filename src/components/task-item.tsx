'use client'

import { useEffect, useRef, useState } from 'react'
import { COMPOSER_INPUT_ID } from '@/components/task-composer'
import { Checkbox } from '@/components/ui/checkbox'
import { X } from '@/lib/icons'
import { ROW_EXIT_MS } from '@/lib/motion'
import type { Task } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

/** Страховка, если animationend не придёт (вкладка в фоне, display:none). */
const EXIT_FALLBACK_MS = ROW_EXIT_MS + 100

type TaskItemProps = {
  task: Task
  /** Когда смонтирован список: строки, пришедшие позже (добавление, undo), раскрываются; при смене фильтра — без анимации. */
  listMountedAt: number
  /** Строку убирает «Удалить выполненные»: только анимация, само удаление делает TodoApp. */
  clearing: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskItem({ task, listMountedAt, clearing, onToggle, onRemove }: TaskItemProps) {
  const ref = useRef<HTMLLIElement>(null)
  const [removing, setRemoving] = useState(false)
  // Анимация входа фиксируется при монтировании и дальше не меняется.
  const [enter] = useState(() => Date.now() - listMountedAt > 100)
  const checkboxId = `task-${task.id}`

  useEffect(() => {
    if (!removing) return
    const timer = window.setTimeout(() => onRemove(task.id), EXIT_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [removing, onRemove, task.id])

  function startRemove() {
    const li = ref.current
    // Удаляли с клавиатуры — переносим фокус на соседнюю задачу или в поле ввода, а не в никуда.
    if (li?.contains(document.activeElement)) {
      const sibling = li.nextElementSibling ?? li.previousElementSibling
      const target = sibling?.querySelector('input') ?? document.getElementById(COMPOSER_INPUT_ID)
      target?.focus()
    }
    setRemoving(true)
  }

  return (
    <li
      ref={ref}
      data-enter={enter ? 'add' : undefined}
      data-leaving={removing || clearing}
      onAnimationEnd={(e) => {
        if (removing && e.target === e.currentTarget && e.animationName === 'row-close') onRemove(task.id)
      }}
      className="p-row-wrap"
    >
      <div
        data-done={task.done}
        className="p-row group -mx-2 grid grid-cols-[33px_minmax(0,1fr)_31px] items-start rounded-lg px-2 py-1"
      >
        <Checkbox id={checkboxId} checked={task.done} onChange={() => onToggle(task.id)} className="-ml-[11px]" />
        <label
          htmlFor={checkboxId}
          className="cursor-pointer py-2.5 pl-1 text-base leading-6 tracking-[-0.005em] [overflow-wrap:anywhere]"
        >
          <span data-done={task.done} className={cn('p-strike', task.done ? 'text-p-ink-2' : 'text-p-ink')}>
            {task.title}
          </span>
        </label>
        <button
          type="button"
          aria-label={`Удалить «${task.title}»`}
          onClick={startRemove}
          className="grid size-11 place-items-center rounded-lg text-p-ink-3 transition-[opacity,color] duration-(--dur-1) group-focus-within:opacity-100 group-hover:opacity-100 hover:text-p-ink focus-visible:opacity-100 [@media(hover:hover)]:opacity-0"
        >
          <X aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </li>
  )
}
