import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // text-base на мобиле — iOS не зумит поле при фокусе
        'h-10 w-full min-w-0 rounded-xl border border-transparent bg-figma-surface-secondary px-3.5 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground hover:border-foreground/10 focus-visible:border-foreground/30 focus-visible:ring-3 focus-visible:ring-foreground/10 focus-visible:outline-none dark:focus-visible:border-ring dark:focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-border dark:bg-background',
        className,
      )}
      {...props}
    />
  )
}
