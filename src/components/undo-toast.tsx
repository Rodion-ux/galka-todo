'use client'

import { useEffect, useRef, useState } from 'react'
import { COMPOSER_INPUT_ID, isTypingTarget } from '@/components/task-composer'
import { useUndo } from '@/lib/tasks/use-tasks'
import type { RemovedEntry } from '@/lib/tasks/store'
import type { UndoEntry } from '@/lib/tasks/undo'

const LIFETIME_MS = 5000

/**
 * Тост «Вернуть» §5.10: чернильная плашка, 5 с, таймер-полоса на паузе при наведении/фокусе,
 * Ctrl/⌘+Z. Живой регион смонтирован всегда — так скринридер надёжно объявит появление.
 */
export function UndoToast() {
  const { entry, undo, dismiss } = useUndo()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 sm:bottom-6"
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

function focusRestored(restored: readonly RemovedEntry[]) {
  if (restored.length === 0) return
  requestAnimationFrame(() => document.getElementById(`task-${restored[0].task.id}`)?.focus())
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

  // Ctrl/⌘+Z, пока тост виден. В непустом поле ввода оставляем родной undo текста.
  useEffect(() => {
    if (leaving) return
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'z' || !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return
      const target = event.target
      if (isTypingTarget(target) && (target as HTMLInputElement).value !== '') return
      event.preventDefault()
      const restored = onUndo(entry.key)
      // Из поля ввода не уводим: человек, скорее всего, продолжит печатать.
      if ((target as HTMLElement | null)?.id !== COMPOSER_INPUT_ID) focusRestored(restored)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entry.key, leaving, onUndo])

  function handleUndo() {
    const hadFocus = focused
    const restored = onUndo(entry.key)
    // Фокус был на «Вернуть» — отдаём его вернувшейся задаче, а не в никуда.
    if (hadFocus) focusRestored(restored)
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
      className="p-toast pointer-events-auto relative flex h-12 w-full max-w-[420px] items-center rounded-xl bg-p-ink pr-1 pl-4 text-p-surface shadow-(--p-toast-shadow)"
    >
      <p className="min-w-0 flex-1 truncate text-sm leading-5">{entry.message}</p>
      <span aria-hidden="true" className="ml-3 h-5 w-px bg-p-toast-rule" />
      <button
        type="button"
        onClick={handleUndo}
        className="p-hit mx-1 h-9 shrink-0 rounded-md px-3 text-sm leading-5 font-medium underline decoration-1 underline-offset-[3px]"
      >
        Вернуть
      </button>
      <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full">
        <span className="p-toast__timer block h-full bg-p-toast-muted" />
      </span>
    </div>
  )
}
