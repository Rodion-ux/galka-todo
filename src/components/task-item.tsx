'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { COMPOSER_INPUT_ID } from '@/components/task-composer'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2 } from '@/lib/icons'
import type { Task } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

/** Страховка, если animationend не придёт (вкладка в фоне, display:none). */
const EXIT_FALLBACK_MS = 400

export type RowEnter = 'add' | 'cascade'

type TaskItemProps = {
  task: Task
  /** Когда смонтирован список: строки первого рендера — каскад, поздние (добавление, undo) — «поп». */
  listMountedAt: number
  index: number
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskItem({ task, listMountedAt, index, onToggle, onRemove }: TaskItemProps) {
  const ref = useRef<HTMLLIElement>(null)
  const [leaving, setLeaving] = useState(false)
  // Анимация входа фиксируется при монтировании и дальше не меняется.
  const [enterMode] = useState<RowEnter>(() => (Date.now() - listMountedAt < 100 ? 'cascade' : 'add'))
  const checkboxId = `task-${task.id}`

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => onRemove(task.id), EXIT_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [leaving, onRemove, task.id])

  function startRemove() {
    const li = ref.current
    // Удаляли с клавиатуры — переносим фокус на соседнюю задачу или в поле ввода, а не в никуда.
    if (li?.contains(document.activeElement)) {
      const sibling = li.nextElementSibling ?? li.previousElementSibling
      const target = sibling?.querySelector('input') ?? document.getElementById(COMPOSER_INPUT_ID)
      target?.focus()
    }
    setLeaving(true)
  }

  return (
    <li
      ref={ref}
      data-enter={enterMode}
      data-leaving={leaving}
      style={{ '--i': index } as CSSProperties}
      onAnimationEnd={(e) => {
        if (leaving && e.animationName === 'row-leave') onRemove(task.id)
      }}
      className="g-row-wrap"
    >
      <div
        className={cn(
          'g-row group flex min-h-14 items-start gap-3 rounded-2xl border py-4 pr-3 pl-4 transition-[background-color,border-color,box-shadow] duration-200',
          task.done
            ? 'border-g-border bg-transparent'
            : 'g-edge border-transparent bg-g-row [@media(hover:hover)]:hover:bg-g-row-hover',
        )}
      >
        <Checkbox
          id={checkboxId}
          checked={task.done}
          onChange={() => onToggle(task.id)}
          className="-mx-[9px] -my-2.5"
        />
        <label
          htmlFor={checkboxId}
          className="min-w-0 flex-1 cursor-pointer text-base leading-6 font-medium tracking-[-0.01em] break-words [overflow-wrap:anywhere]"
        >
          <span data-done={task.done} className={cn('g-strike', task.done ? 'text-g-done' : 'text-g-text')}>
            {task.title}
          </span>
        </label>
        <button
          type="button"
          aria-label={`Удалить «${task.title}»`}
          onClick={startRemove}
          className="g-hit -my-1.5 -mr-1 grid size-9 shrink-0 place-items-center rounded-xl text-g-muted transition-[opacity,color,background-color,transform] duration-150 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-g-danger-soft hover:text-g-danger focus-visible:bg-g-danger-soft focus-visible:text-g-danger focus-visible:opacity-100 active:scale-92 [@media(hover:hover)]:opacity-0 [@media(hover:none)]:opacity-60"
        >
          <Trash2 aria-hidden="true" className="size-[18px]" strokeWidth={1.9} />
        </button>
      </div>
    </li>
  )
}
