'use client'

/**
 * «Удалить выполненные · N» §5.10. Число в подписи, при наведении/фокусе подсвечиваются
 * ровно те строки, что уйдут (CSS :has в globals.css), страховка — тост «Вернуть».
 */
export function ClearDoneButton({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Удалить выполненные задачи: ${count}`}
      className="p-clear-done p-hit -mr-1 h-8 self-end rounded-md px-1 text-sm leading-5 text-p-ink-2 tabular-nums transition-colors duration-(--dur-1) hover:text-p-ink"
    >
      Удалить выполненные · {count}
    </button>
  )
}
