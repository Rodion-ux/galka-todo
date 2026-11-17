import { LogoMark } from '@/components/logo-mark'
import type { Filter } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

type EmptyCopy = { title: string; text: string; tone: 'accent' | 'neutral'; ghosts: boolean }

function getEmptyCopy(filter: Filter, totalCount: number): EmptyCopy {
  if (totalCount === 0) {
    return {
      title: 'Пока пусто',
      text: 'Запишите первое дело — галка отметит, когда справитесь.',
      tone: 'accent',
      ghosts: true,
    }
  }
  if (filter === 'active') {
    return { title: 'Всё сделано', text: 'Активных задач нет. Заслуженный отдых.', tone: 'accent', ghosts: false }
  }
  return { title: 'Ещё ничего не отмечено', text: 'Отметьте задачу — она появится здесь.', tone: 'neutral', ghosts: false }
}

/** Пустые состояния §4.5: тактильная плашка со знаком, заголовок Unbounded, призрачные строки. */
export function EmptyState({ filter, totalCount }: { filter: Filter; totalCount: number }) {
  const { title, text, tone, ghosts } = getEmptyCopy(filter, totalCount)
  return (
    <div className="g-fade-in flex flex-col items-center px-2 py-10 text-center">
      <div
        aria-hidden="true"
        className={cn(
          'g-bob grid size-[88px] place-items-center rounded-[26px]',
          tone === 'accent'
            ? 'bg-linear-to-b from-g-accent to-(--g-accent-deep) text-g-on-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_16px_40px_-12px_var(--g-accent-glow)]'
            : 'g-edge bg-g-row text-g-muted',
        )}
      >
        <LogoMark className="size-12" />
      </div>
      <p className="ty-empty-title mt-6 text-g-text">{title}</p>
      <p className="mt-2 max-w-[300px] text-sm leading-5 font-medium text-g-muted">{text}</p>
      {ghosts && (
        <div aria-hidden="true" className="mt-6 flex w-full flex-col items-center gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex h-11 w-full max-w-[280px] items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-g-border-strong px-3.5 opacity-35"
            >
              <span className="size-[18px] rounded-full border-[1.5px] border-dashed border-g-border-strong" />
              <span className={cn('h-2 rounded-full bg-g-border-strong/50', i === 0 ? 'w-32' : 'w-20')} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
