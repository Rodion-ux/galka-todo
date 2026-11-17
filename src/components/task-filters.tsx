'use client'

import { Button } from '@/components/ui/button'
import { KRIVO_SEGMENTED, KRIVO_SEGMENTED_BUTTON, KRIVO_SEGMENTED_BUTTON_ACTIVE } from '@/lib/krivo-ui'
import { formatRemaining } from '@/lib/plural'
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
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div role="group" aria-label="Фильтр задач" className={cn(KRIVO_SEGMENTED, 'w-full sm:w-auto')}>
        {FILTERS.map(({ value, label }) => {
          const active = filter === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onFilterChange(value)}
              className={cn(KRIVO_SEGMENTED_BUTTON, 'flex-1 sm:flex-none', active && KRIVO_SEGMENTED_BUTTON_ACTIVE)}
            >
              {label}
              <span className="ty-micro tabular-nums opacity-60">{counts[value]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex min-h-8 flex-1 items-center justify-between gap-3 sm:justify-end">
        <p aria-live="polite" className="ty-meta tabular-nums whitespace-nowrap">
          {counts.active === 0 ? 'Все задачи выполнены' : formatRemaining(counts.active)}
        </p>
        {counts.done > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearDone}>
            Очистить выполненные
          </Button>
        )}
      </div>
    </div>
  )
}
