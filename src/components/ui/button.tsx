import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const base =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const variants = {
  default: 'bg-foreground text-background shadow-soft hover:bg-foreground/90',
  ghost:
    'text-muted-foreground hover:bg-figma-surface-secondary hover:text-foreground dark:hover:bg-secondary',
  destructiveGhost:
    'text-muted-foreground hover:bg-figma-error-soft hover:text-figma-error focus-visible:text-figma-error',
} as const

const sizes = {
  default: 'h-9 gap-1.5 px-4',
  sm: 'h-8 gap-1 px-3 text-xs',
  lg: 'h-10 gap-1.5 px-4',
  'icon-sm': 'size-8',
  icon: 'size-9',
  'icon-lg': 'size-10',
} as const

export type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}
