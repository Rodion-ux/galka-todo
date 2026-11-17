'use client'

import { useEffect, useRef } from 'react'
import { RollingNumber } from '@/components/rolling-number'
import { burstConfetti } from '@/lib/confetti'
import { formatRemaining } from '@/lib/plural'
import { formatToday, greeting, useNowMinute } from '@/lib/today'
import { cn } from '@/lib/utils'

const MAX_SEGMENTS = 12

/** Прогресс дня §4.5: дата, большой счётчик «выполнено/всего», сегменты или бар. */
export function TodayProgress({ done, total }: { done: number; total: number }) {
  const now = useNowMinute()
  const allDone = total > 0 && done === total
  const confettiRef = useRef<HTMLSpanElement>(null)
  const wasAllDone = useRef(allDone)

  // Конфетти один раз на переход «не всё → всё», не при загрузке.
  useEffect(() => {
    if (allDone && !wasAllDone.current && confettiRef.current) burstConfetti(confettiRef.current)
    wasAllDone.current = allDone
  }, [allDone])

  return (
    <section aria-label="Сегодня" data-all-done={allDone} className="flex flex-col gap-3">
      <p className="ty-micro h-4">
        {now !== null && (
          <span className="g-fade-in">
            {formatToday(now)}
            <span className="px-1.5 opacity-60">·</span>
            {greeting(new Date(now).getHours())}
          </span>
        )}
      </p>

      <div className="flex items-end justify-between gap-4">
        <div
          aria-hidden="true"
          className={cn(
            'ty-counter relative flex h-14 items-end transition-[color,text-shadow] duration-300 max-[480px]:h-11',
            allDone ? 'text-g-accent-text [text-shadow:var(--g-counter-halo)]' : 'text-g-text',
          )}
        >
          <span ref={confettiRef} className="pointer-events-none absolute inset-0" />
          <RollingNumber value={done} />
          <span className={cn('transition-colors duration-300', !allDone && 'text-g-muted')}>/{total}</span>
        </div>
        <p aria-live="polite" className={cn('ty-micro pb-1.5 text-right', allDone && 'text-g-accent-text')}>
          {allDone ? 'Всё сделано' : formatRemaining(total - done)}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Прогресс дня"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`Выполнено ${done} из ${total}`}
        className="flex h-1.5 gap-1"
      >
        {total <= MAX_SEGMENTS ? (
          Array.from({ length: total }, (_, i) => <Segment key={i} filled={i < done} />)
        ) : (
          <div className="relative flex-1 overflow-hidden rounded-full bg-g-row">
            <div
              className="absolute inset-0 origin-left rounded-full bg-g-accent transition-transform duration-400 ease-(--ease-out)"
              style={{ transform: `scaleX(${done / total})` }}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function Segment({ filled }: { filled: boolean }) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-full bg-g-row">
      <div
        className={cn(
          'absolute inset-0 origin-left rounded-full bg-g-accent transition-transform duration-400 ease-(--ease-out)',
          filled ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </div>
  )
}
