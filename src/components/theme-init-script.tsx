'use client'

import { useRef } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { themeInitScript } from '@/lib/theme'

/**
 * Вставляет скрипт темы в серверный HTML (в <head>), до первой отрисовки —
 * без вспышки светлой темы. useServerInsertedHTML не создаёт <script> в
 * клиентском дереве, поэтому нет dev-предупреждения React о script-теге.
 */
export function ThemeInitScript() {
  const inserted = useRef(false)
  useServerInsertedHTML(() => {
    if (inserted.current) return null
    inserted.current = true
    return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
  })
  return null
}
