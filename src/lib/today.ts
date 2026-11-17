import { useSyncExternalStore } from 'react'

/** Текущая минута (ms epoch, округлено). null на сервере — дата только после гидрации. */
function subscribeMinute(listener: () => void) {
  const timer = window.setInterval(listener, 30_000)
  return () => window.clearInterval(timer)
}
const getMinute = () => Math.floor(Date.now() / 60_000) * 60_000
const getServerMinute = () => null

export function useNowMinute(): number | null {
  return useSyncExternalStore(subscribeMinute, getMinute, getServerMinute)
}

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })

/** «вт, 17 ноября» (в UI капсом через CSS). */
export function formatToday(ms: number): string {
  return DATE_FORMAT.format(ms)
}

/** Приветствие по времени суток: 05–11 / 12–16 / 17–22 / 23–04. */
export function greeting(hour: number): string {
  if (hour >= 5 && hour <= 11) return 'Доброе утро'
  if (hour >= 12 && hour <= 16) return 'Добрый день'
  if (hour >= 17 && hour <= 22) return 'Добрый вечер'
  return 'Доброй ночи'
}
