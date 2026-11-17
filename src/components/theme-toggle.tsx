'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun, type LucideIcon } from '@/lib/icons'
import { applyTheme, readThemePref, subscribeTheme, writeThemePref, type ThemePref } from '@/lib/theme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ThemePref; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Светлая тема', icon: Sun },
  { value: 'dark', label: 'Тёмная тема', icon: Moon },
  { value: 'system', label: 'Как в системе', icon: Monitor },
]

const getServerPref = (): ThemePref | null => null

export function ThemeToggle() {
  // null на сервере и при гидрации: не подсвечиваем ни один вариант, пока не знаем выбор
  const pref = useSyncExternalStore<ThemePref | null>(subscribeTheme, readThemePref, getServerPref)
  const activeIndex = OPTIONS.findIndex((o) => o.value === pref)

  // В dev Strict Mode React сбрасывает атрибуты <html> при ремоунте — возвращаем класс темы.
  useLayoutEffect(() => {
    applyTheme(readThemePref())
  }, [])

  return (
    <div role="group" aria-label="Тема оформления" className="relative flex h-11">
      {/* Видимая дорожка 36px; кнопки 44×44, чтобы хит-зоны не перекрывались */}
      <span aria-hidden="true" className="absolute inset-x-1 inset-y-1 rounded-full bg-g-row g-edge" />
      {activeIndex >= 0 && (
        <span
          aria-hidden="true"
          className="absolute top-[7px] left-[7px] size-[30px] rounded-full bg-g-thumb shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform duration-[280ms] ease-(--ease-spring)"
          style={{ transform: `translateX(${activeIndex * 44}px)` }}
        />
      )}
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = pref === value
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => writeThemePref(value)}
            className={cn(
              'relative z-[1] grid size-11 place-items-center rounded-full text-g-muted transition-[color,transform] duration-150 hover:text-g-text active:scale-92',
              active && 'text-g-text',
              active && value === 'dark' && 'drop-shadow-[0_0_6px_var(--g-accent-glow)]',
            )}
          >
            <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.9} />
          </button>
        )
      })}
    </div>
  )
}
