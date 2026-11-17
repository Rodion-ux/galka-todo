'use client'

import { useRef, type KeyboardEvent } from 'react'
import type { Filter } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'done', label: 'Готово' },
]

type TaskFiltersProps = {
  filter: Filter
  onFilterChange: (filter: Filter) => void
}

/** Фильтры §5.10: пилюли без счётчиков (число уже в «3/7»), активная — чернилами. */
export function TaskFilters({ filter, onFilterChange }: TaskFiltersProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const activeIndex = FILTERS.findIndex((f) => f.value === filter)

  // radiogroup: стрелки двигают выбор и фокус, Tab заходит только в выбранный вариант.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    const jump = event.key === 'Home' ? 0 : event.key === 'End' ? FILTERS.length - 1 : null
    if (step === undefined && jump === null) return
    event.preventDefault()
    const next = jump ?? (activeIndex + step! + FILTERS.length) % FILTERS.length
    onFilterChange(FILTERS[next].value)
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Фильтр задач"
      onKeyDown={handleKeyDown}
      className="flex gap-1"
    >
      {FILTERS.map(({ value, label }) => {
        const active = filter === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onFilterChange(value)}
            className={cn(
              'p-hit h-9 shrink-0 rounded-full px-3.5 text-sm leading-5 font-medium',
              active ? 'bg-p-ink text-p-surface' : 'text-p-ink-2 [@media(hover:hover)]:hover:bg-p-row-hover',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
