'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Roll = { value: number; prev: number | null; dir: 'up' | 'down' | null }

/**
 * Число, которое «перекатывается» при изменении: старое уходит вверх, новое приходит снизу
 * (при уменьшении — наоборот). При первом рендере не анимируется.
 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const [roll, setRoll] = useState<Roll>({ value, prev: null, dir: null })

  // Производное состояние из пропа — шаблон React «adjusting state on prop change».
  if (roll.value !== value) {
    setRoll({ value, prev: roll.value, dir: value > roll.value ? 'up' : 'down' })
  }

  return (
    <span className={cn('relative inline-grid', className)}>
      {roll.prev !== null && roll.dir && (
        <span
          key={`out-${roll.prev}-${roll.value}`}
          aria-hidden="true"
          className={cn('col-start-1 row-start-1', roll.dir === 'up' ? 'p-roll-out-up' : 'p-roll-out-down')}
          onAnimationEnd={() => setRoll((r) => ({ ...r, prev: null }))}
        >
          {roll.prev}
        </span>
      )}
      <span
        key={`in-${roll.value}`}
        className={cn(
          'col-start-1 row-start-1',
          roll.dir === 'up' && 'p-roll-in-up',
          roll.dir === 'down' && 'p-roll-in-down',
        )}
      >
        {roll.value}
      </span>
    </span>
  )
}
