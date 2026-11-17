export type ThemePref = 'light' | 'dark' | 'system'

export const THEME_KEY = 'galka:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

export function isThemePref(value: unknown): value is ThemePref {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** Тема по умолчанию (ничего не выбрано): тёмная — в ней бренд звучит сильнее всего. */
export const DEFAULT_THEME: ThemePref = 'dark'

/**
 * Синхронный скрипт для <head>: ставит класс .dark на <html> до первой отрисовки.
 * Логика должна совпадать с resolveDark/applyTheme ниже.
 */
export const themeInitScript = `(function(){var d=document.documentElement,k=true;try{var t=localStorage.getItem('${THEME_KEY}');k=t==='light'?false:t==='system'?window.matchMedia('${DARK_QUERY}').matches:true}catch(e){}d.classList.toggle('dark',k);d.style.colorScheme=k?'dark':'light'})()`

export function readThemePref(): ThemePref {
  try {
    const value = window.localStorage.getItem(THEME_KEY)
    return isThemePref(value) ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia(DARK_QUERY).matches
  } catch {
    return false
  }
}

export function resolveDark(pref: ThemePref): boolean {
  return pref === 'dark' || (pref === 'system' && systemPrefersDark())
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement
  const dark = resolveDark(pref)
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
}

const listeners = new Set<() => void>()

let switchTimer: number | undefined

/** На 250 мс включает плавную смену цветов (класс на <html>), без вечного transition. */
function flagThemeSwitch() {
  const root = document.documentElement
  root.classList.add('theme-switching')
  window.clearTimeout(switchTimer)
  switchTimer = window.setTimeout(() => root.classList.remove('theme-switching'), 250)
}

export function writeThemePref(pref: ThemePref) {
  flagThemeSwitch()
  try {
    window.localStorage.setItem(THEME_KEY, pref)
  } catch {
    // хранилище недоступно — тема просто не запомнится
  }
  applyTheme(pref)
  for (const listener of listeners) listener()
}

/** Подписка для useSyncExternalStore: своя запись, другая вкладка, смена системной темы. */
export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (readThemePref() === 'system') applyTheme('system')
    listener()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY && event.key !== null) return
    applyTheme(readThemePref())
    listener()
  }
  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}
