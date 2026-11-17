import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'>

/**
 * Круглый чекбокс §5.10: нативный input поверх визуального круга 22 px, хит-зона 44 px.
 * Заливка киноварью и прорисовка галочки — CSS-переходы (.p-check в globals.css), без частиц.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className={cn('p-check', className)}>
      <input type="checkbox" data-slot="checkbox" className="p-check__input" {...props} />
      <span aria-hidden="true" className="p-check__box">
        <span className="p-check__fill" />
        <svg viewBox="0 0 22 22" className="p-check__mark">
          <path d="M6.5 11.5l3 3L15.75 8" pathLength={20} />
        </svg>
      </span>
    </span>
  )
}
