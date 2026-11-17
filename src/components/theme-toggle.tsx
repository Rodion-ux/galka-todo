'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun, type LucideIcon } from '@/lib/icons'
import { KRIVO_SEGMENTED, KRIVO_SEGMENTED_BUTTON, KRIVO_SEGMENTED_BUTTON_ACTIVE } from '@/lib/krivo-ui'
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

  // В dev Strict Mode React сбрасывает атрибуты <html> при ремоунте — возвращаем класс темы.
  useLayoutEffect(() => {
    applyTheme(readThemePref())
  }, [])

  return (
    <div role="group" aria-label="Тема оформления" className={cn(KRIVO_SEGMENTED, 'h-9 rounded-[11px]')}>
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
            className={cn(KRIVO_SEGMENTED_BUTTON, 'h-8 w-8 rounded-[9px] px-0', active && KRIVO_SEGMENTED_BUTTON_ACTIVE)}
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
