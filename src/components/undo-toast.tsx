'use client'

import { useEffect, useRef, useState } from 'react'
import { useUndo } from '@/lib/tasks/use-tasks'
import type { RemovedEntry } from '@/lib/tasks/store'
import type { UndoEntry } from '@/lib/tasks/undo'

const LIFETIME_MS = 5000

/**
 * Тост «Вернуть» §4.5: живёт 5 с, пауза на hover/фокус, новый заменяет старый.
 * Живой регион смонтирован всегда — так скринридер надёжно объявит появление.
 */
export function UndoToast() {
  const { entry, undo, dismiss } = useUndo()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
    >
      {entry && <Toast key={entry.key} entry={entry} onUndo={undo} onDismiss={dismiss} />}
    </div>
  )
}

type ToastProps = {
  entry: UndoEntry
  onUndo: (key: number) => readonly RemovedEntry[]
  onDismiss: (key: number) => void
}

function Toast({ entry, onUndo, onDismiss }: ToastProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const remaining = useRef(LIFETIME_MS)
  const paused = hovered || focused

  useEffect(() => {
    if (paused || leaving) return
    const startedAt = performance.now()
    const timer = window.setTimeout(() => setLeaving(true), remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current -= performance.now() - startedAt
    }
  }, [paused, leaving])

  function handleUndo() {
    const hadFocus = focused
    const restored = onUndo(entry.key)
    // Фокус был на «Вернуть» — отдаём его вернувшейся задаче, а не в никуда.
    if (hadFocus && restored.length > 0) {
      requestAnimationFrame(() => document.getElementById(`task-${restored[0].task.id}`)?.focus())
    }
  }

  return (
    <div
      data-leaving={leaving}
      data-paused={paused}
      onAnimationEnd={(e) => {
        if (leaving && e.animationName === 'toast-out') onDismiss(entry.key)
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="g-toast pointer-events-auto flex h-12 w-full max-w-[420px] items-center gap-3 rounded-2xl bg-g-text py-2 pr-2 pl-4 text-g-bg shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)]"
    >
      <svg aria-hidden="true" viewBox="0 0 18 18" className="size-4 shrink-0 -rotate-90">
        <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={2} />
        <circle
          cx="9"
          cy="9"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="g-toast__ring"
        />
      </svg>
      <p className="min-w-0 flex-1 truncate text-sm leading-5 font-medium">{entry.message}</p>
      <button
        type="button"
        onClick={handleUndo}
        className="g-key h-8 shrink-0 rounded-full px-4 text-sm font-semibold transition-transform duration-100 active:scale-95"
      >
        Вернуть
      </button>
    </div>
  )
}
