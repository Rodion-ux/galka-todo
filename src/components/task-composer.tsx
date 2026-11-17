'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { TITLE_MAX_LENGTH } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

export const COMPOSER_INPUT_ID = 'task-input'
const COUNTER_FROM = TITLE_MAX_LENGTH - 20

export function isTypingTarget(el: EventTarget | null) {
  if (el instanceof HTMLInputElement) return !/^(checkbox|radio|button|submit|reset)$/.test(el.type)
  return el instanceof HTMLElement && (el.isContentEditable || /^(TEXTAREA|SELECT)$/.test(el.tagName))
}

/** Поле ввода §5.10: «бумажная» плашка, кнопка «Добавить» внутри справа. Без kbd-чипов и подсказок. */
export function TaskComposer({ onAdd }: { onAdd: (title: string) => unknown }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const canSubmit = value.trim().length > 0

  useEffect(() => {
    // Автофокус только там, где есть точный указатель: на мобиле не выдвигаем клавиатуру сами.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) inputRef.current?.focus()
    // «/» из любого места страницы — фокус в поле ввода.
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    onAdd(value)
    // Очищаем сразу: второй быстрый Enter увидит пустое поле и ничего не добавит.
    setValue('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && value !== '') {
      event.preventDefault()
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={COMPOSER_INPUT_ID} className="sr-only">
        Новая задача
      </label>
      <div className="flex h-14 items-center gap-2 rounded-xl border border-p-line bg-p-surface pr-1.5 pl-4 transition-[border-color] duration-(--dur-1) focus-within:border-p-ink">
        <input
          ref={inputRef}
          id={COMPOSER_INPUT_ID}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="Новая задача"
          autoComplete="off"
          enterKeyHint="done"
          aria-describedby={value.length >= COUNTER_FROM ? 'task-input-counter' : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base leading-6 tracking-[-0.005em] text-p-ink outline-none placeholder:text-p-placeholder focus-visible:outline-none sm:text-[17px]"
        />
        <button
          type="submit"
          aria-label="Добавить задачу"
          aria-disabled={!canSubmit}
          className={cn(
            'h-11 shrink-0 rounded-full px-4 text-sm leading-5 font-medium transition-[background-color,color] duration-(--dur-1)',
            canSubmit ? 'bg-p-ink text-p-surface' : 'cursor-default bg-p-row-hover text-p-ink-3',
          )}
        >
          Добавить
        </button>
      </div>
      {value.length >= COUNTER_FROM && (
        <p id="task-input-counter" className="px-4 text-sm leading-5 text-p-ink-2 tabular-nums">
          {value.length} из {TITLE_MAX_LENGTH} символов
        </p>
      )}
    </form>
  )
}
