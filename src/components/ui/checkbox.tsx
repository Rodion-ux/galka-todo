import type { ComponentProps } from 'react'
import { Check } from '@/lib/icons'
import { cn } from '@/lib/utils'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'>

/** Нативный checkbox, стилизованный под Krivo (size-5, rounded-[6px]). */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className={cn('relative inline-flex size-5 shrink-0', className)}>
      <input
        type="checkbox"
        data-slot="checkbox"
        className="peer size-5 shrink-0 cursor-pointer appearance-none rounded-[6px] border-2 border-figma-surface-tertiary transition-colors outline-none hover:border-foreground/30 hover:bg-secondary/50 checked:border-primary checked:bg-primary checked:hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:border-muted-foreground/40 dark:checked:border-primary dark:checked:bg-primary"
        {...props}
      />
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto size-3.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </span>
  )
}
