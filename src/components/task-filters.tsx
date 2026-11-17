'use client'

import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import type { Filter } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

export type TaskCounts = { all: number; active: number; done: number }

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'done', label: 'Готово' },
]

type TaskFiltersProps = {
  filter: Filter
  counts: TaskCounts
  onFilterChange: (filter: Filter) => void
  onClearDone: () => void
}

export function TaskFilters({ filter, counts, onFilterChange, onClearDone }: TaskFiltersProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const activeIndex = FILTERS.findIndex((f) => f.value === filter)

  // Бегунок едет под активную вкладку: меряем кнопку (ширины разные) и пишем стиль прямо в DOM.
  useLayoutEffect(() => {
    const group = groupRef.current
    const thumb = thumbRef.current
    if (!group || !thumb) return
    const place = () => {
      const active = group.querySelector<HTMLElement>('[aria-checked="true"]')
      if (!active) return
      thumb.style.width = `${active.offsetWidth}px`
      thumb.style.transform = `translateX(${active.offsetLeft - 4}px)`
    }
    place()
    // Первое позиционирование без анимации, дальше — с пружиной.
    const raf = requestAnimationFrame(() => (thumb.dataset.ready = 'true'))
    const observer = new ResizeObserver(place)
    observer.observe(group)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [filter])

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
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Фильтр задач"
        onKeyDown={handleKeyDown}
        className="g-edge relative flex h-11 rounded-[14px] bg-g-row p-1 max-sm:w-full sm:mr-auto"
      >
        <span
          ref={thumbRef}
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-[10px] bg-g-thumb shadow-[0_1px_2px_rgba(0,0,0,0.12)] data-ready:transition-[transform,width] data-ready:duration-[280ms] data-ready:ease-(--ease-spring)"
        />
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
                'g-hit relative z-[1] inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3.5 max-sm:flex-1 max-sm:px-2 text-sm font-medium text-g-muted transition-colors duration-150 hover:text-g-text',
                active && 'text-g-text',
              )}
            >
              {label}
              <span aria-hidden="true" className="font-mono text-xs tabular-nums">
                {counts[value]}
              </span>
            </button>
          )
        })}
      </div>

      {counts.done > 0 && (
        <button
          type="button"
          onClick={onClearDone}
          className="g-fade-in g-hit h-9 rounded-xl px-3 text-sm max-sm:-mr-3 font-semibold text-g-muted transition-[color,background-color,transform] duration-150 hover:bg-g-danger-soft hover:text-g-danger focus-visible:text-g-danger active:scale-97"
        >
          Очистить выполненные
        </button>
      )}
    </div>
  )
}
