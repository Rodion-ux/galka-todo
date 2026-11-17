'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { ArrowUp } from '@/lib/icons'
import { EASE_SPRING, prefersReducedMotion } from '@/lib/motion'
import { TITLE_MAX_LENGTH } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

export const COMPOSER_INPUT_ID = 'task-input'
const COUNTER_FROM = TITLE_MAX_LENGTH - 20

const SHAKE: Keyframe[] = [0, -6, 6, -4, 4, 0].map((x) => ({ transform: `translateX(${x}px)` }))

function isTypingTarget(el: EventTarget | null) {
  if (el instanceof HTMLInputElement) return !/^(checkbox|radio|button|submit|reset)$/.test(el.type)
  return el instanceof HTMLElement && (el.isContentEditable || /^(TEXTAREA|SELECT)$/.test(el.tagName))
}

export function TaskComposer({ onAdd }: { onAdd: (title: string) => unknown }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const tileRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
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
    if (!canSubmit) return shake()
    onAdd(value)
    // Очищаем сразу: второй быстрый Enter увидит пустое поле и ничего не добавит.
    setValue('')
    inputRef.current?.focus()
    if (!prefersReducedMotion()) {
      buttonRef.current?.animate([{ transform: 'scale(0.92)' }, { transform: 'scale(1)' }], {
        duration: 280,
        easing: EASE_SPRING,
      })
    }
  }

  function shake() {
    if (!prefersReducedMotion()) tileRef.current?.animate(SHAKE, { duration: 300, easing: 'ease-out' })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // С пустым полем кнопка disabled и форма не отправится — подсказываем «тряской».
    if (event.key === 'Enter' && !canSubmit) shake()
    if (event.key === 'Escape' && value !== '') {
      event.preventDefault()
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label htmlFor={COMPOSER_INPUT_ID} className="sr-only">
        Новая задача
      </label>
      <div
        ref={tileRef}
        className="g-edge flex h-14 items-center gap-2 rounded-[20px] bg-g-row pr-2 pl-5 transition-[background-color,box-shadow] duration-200 focus-within:bg-(--g-composer-focus) focus-within:shadow-[0_0_0_2px_var(--g-cobalt)]"
      >
        <input
          ref={inputRef}
          id={COMPOSER_INPUT_ID}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="Что нужно сделать?"
          autoComplete="off"
          enterKeyHint="done"
          aria-describedby={value.length >= COUNTER_FROM ? 'task-input-counter' : undefined}
          className="peer h-full min-w-0 flex-1 bg-transparent text-[17px] leading-6 font-medium tracking-[-0.01em] text-g-text outline-none placeholder:text-g-muted focus-visible:outline-none"
        />
        {canSubmit ? (
          <Kbd key="enter" className="g-fade-in max-sm:hidden [@media(hover:none)]:hidden">
            Enter
          </Kbd>
        ) : (
          <Kbd key="slash" className="g-fade-in peer-focus:hidden max-sm:hidden [@media(hover:none)]:hidden" title="Нажмите «/», чтобы начать ввод">
            /
          </Kbd>
        )}
        <button
          ref={buttonRef}
          type="submit"
          aria-label="Добавить задачу"
          disabled={!canSubmit}
          className={cn(
            'g-hit grid size-10 shrink-0 place-items-center rounded-full transition-[background-color,color,box-shadow,filter,transform] duration-150 active:scale-92',
            canSubmit
              ? 'g-key hover:shadow-[0_0_20px_var(--g-accent-glow)] hover:brightness-105'
              : 'bg-(--g-key-idle) text-g-muted',
          )}
        >
          <ArrowUp aria-hidden="true" className="size-5" strokeWidth={2.25} />
        </button>
      </div>
      {value.length >= COUNTER_FROM && (
        <p
          id="task-input-counter"
          className={cn('px-5 text-xs text-g-muted', value.length >= TITLE_MAX_LENGTH && 'text-g-danger')}
        >
          {value.length} из {TITLE_MAX_LENGTH} символов
        </p>
      )}
    </form>
  )
}
