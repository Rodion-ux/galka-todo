import type { Filter } from '@/lib/tasks/types'

function getEmptyText(filter: Filter, totalCount: number): string {
  if (totalCount === 0) return 'Список пуст.'
  if (filter === 'active') return 'Активных задач нет.'
  return 'Выполненных пока нет.'
}

/** Пустые состояния §5.10: одна строка на месте списка, без иллюстраций и восклицаний. */
export function EmptyState({ filter, totalCount }: { filter: Filter; totalCount: number }) {
  return <p className="pt-4 text-sm leading-5 text-p-ink-2">{getEmptyText(filter, totalCount)}</p>
}
