import { RollingNumber } from '@/components/rolling-number'
import { cn } from '@/lib/utils'

/** Больше — сегменты становятся слишком узкими, рисуем одну полосу. */
const MAX_SEGMENTS = 24

/**
 * Счётчик «3/7» и сегментный степпер (BRIEF-v2 §5.10).
 * Без подписей рядом: число озвучивается через role=status. Финал 7/7 — вся дробь чернилами.
 */
export function ProgressCounter({ done, total }: { done: number; total: number }) {
  const empty = total === 0
  const allDone = !empty && done === total
  const label = `Выполнено ${done} из ${total}`

  return (
    <section className="flex flex-col gap-5">
      <p role="status" aria-live="polite" aria-label={label} className="ty-counter flex">
        <span aria-hidden="true" className={cn('flex', empty ? 'text-p-ink-3' : 'text-p-ink')}>
          <RollingNumber value={done} />
          <span className={cn('transition-colors duration-(--dur-2)', !allDone && 'text-p-ink-3')}>/{total}</span>
        </span>
        <span className="sr-only">{label}</span>
      </p>

      <div
        role="progressbar"
        aria-label="Прогресс дня"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={label}
        className="flex h-1.5 items-center gap-1"
      >
        {empty ? (
          <div className="h-px flex-1 bg-p-line" />
        ) : total <= MAX_SEGMENTS ? (
          Array.from({ length: total }, (_, i) => <Bar key={i} fill={i < done ? 1 : 0} />)
        ) : (
          <Bar fill={done / total} />
        )}
      </div>
    </section>
  )
}

function Bar({ fill }: { fill: number }) {
  return (
    <div className="relative h-1.5 flex-1 overflow-hidden rounded-[2px] bg-p-track">
      <div className="p-seg__fill absolute inset-0 bg-p-accent" style={{ transform: `scaleX(${fill})` }} />
    </div>
  )
}
