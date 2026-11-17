import { LogoMark } from '@/components/logo-mark'
import { cn } from '@/lib/utils'

/**
 * Знак Галки в шапке. Форма — в logo-mark.tsx (currentColor), цвет — здесь:
 * на тёмной теме лаймовый, на светлой чернильный (токен --g-logo, BRIEF §5).
 * Декоративный: рядом всегда есть вордмарк «Галка».
 */
export function Logo({ className }: { className?: string }) {
  return <LogoMark className={cn('size-8 shrink-0 text-g-logo', className)} />
}
