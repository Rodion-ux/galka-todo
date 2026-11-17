/**
 * Русская плюрализация: pluralize(1, ['задача', 'задачи', 'задач']) → 'задача'.
 * forms: [one, few, many] — 1 / 2–4 / 5–20, 0.
 */
export function pluralize(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(Math.trunc(n))
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

export const TASK_FORMS = ['задача', 'задачи', 'задач'] as const

/** «1 задача», «3 задачи», «5 задач». */
export function formatTaskCount(n: number): string {
  return `${n} ${pluralize(n, TASK_FORMS)}`
}

/** «Осталась 1 задача», «Осталось 3 задачи», «Осталось 5 задач». */
export function formatRemaining(n: number): string {
  const verb = pluralize(n, ['Осталась', 'Осталось', 'Осталось'])
  return `${verb} ${formatTaskCount(n)}`
}
