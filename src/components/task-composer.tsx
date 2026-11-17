'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from '@/lib/icons'
import { TITLE_MAX_LENGTH } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'

export const COMPOSER_INPUT_ID = 'task-input'
const COUNTER_FROM = TITLE_MAX_LENGTH - 20

export function TaskComposer({ onAdd }: { onAdd: (title: string) => unknown }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const canSubmit = value.trim().length > 0

  // Автофокус только там, где есть точный указатель: на мобиле не выдвигаем клавиатуру сами.
  useEffect(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      inputRef.current?.focus()
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    onAdd(value)
    // Очищаем сразу: второй быстрый Enter увидит пустое поле и ничего не добавит.
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label htmlFor={COMPOSER_INPUT_ID} className="sr-only">
        Новая задача
      </label>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={COMPOSER_INPUT_ID}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="Что нужно сделать?"
          autoComplete="off"
          enterKeyHint="done"
          aria-describedby={value.length >= COUNTER_FROM ? 'task-input-counter' : undefined}
        />
        <Button type="submit" size="lg" disabled={!canSubmit} className="max-sm:w-10 max-sm:px-0">
          <Plus aria-hidden="true" />
          <span className="max-sm:sr-only">Добавить</span>
        </Button>
      </div>
      {value.length >= COUNTER_FROM && (
        <p
          id="task-input-counter"
          className={cn('px-1 text-xs text-muted-foreground', value.length >= TITLE_MAX_LENGTH && 'text-figma-error')}
        >
          {value.length} из {TITLE_MAX_LENGTH} символов
        </p>
      )}
    </form>
  )
}
