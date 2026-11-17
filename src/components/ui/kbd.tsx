import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Подсказка клавиши: mono 11 px на поверхности с волосяной обводкой. */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-g-border bg-g-surface px-1.5 font-mono text-[11px] leading-4 font-medium text-g-muted select-none',
        className,
      )}
      {...props}
    />
  )
}
