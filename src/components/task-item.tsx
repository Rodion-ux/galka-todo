'use client'

import { useEffect, useRef, useState } from 'react'
import { COMPOSER_INPUT_ID } from '@/components/task-composer'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2 } from '@/lib/icons'
import { KRIVO_ROW_HOVER } from '@/lib/krivo-ui'
import type { Task } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

/** Страховка, если animationend не придёт (вкладка в фоне, display:none). */
const EXIT_FALLBACK_MS = 300

type TaskItemProps = {
  task: Task
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  const ref = useRef<HTMLLIElement>(null)
  const [leaving, setLeaving] = useState(false)
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
      onAnimationEnd={(e) => {
        if (leaving && e.animationName === 'task-out') onRemove(task.id)
      }}
      className={cn(
        'group flex items-start gap-3 rounded-[10px] py-1 pr-1 pl-2 transition-colors',
        KRIVO_ROW_HOVER,
        leaving ? 'pointer-events-none animate-task-out' : 'animate-task-in',
      )}
    >
      <Checkbox
        id={checkboxId}
        checked={task.done}
        onChange={() => onToggle(task.id)}
        className="mt-1.5"
      />
      <label
        htmlFor={checkboxId}
        className={cn(
          'min-w-0 flex-1 cursor-pointer py-1.5 text-sm break-words text-figma-body transition-colors [overflow-wrap:anywhere]',
          task.done && 'text-figma-body-muted line-through',
        )}
      >
        {task.title}
      </label>
      <Button
        variant="destructiveGhost"
        size="icon-sm"
        aria-label={`Удалить «${task.title}»`}
        onClick={startRemove}
        className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  )
}
