'use client'

import { useRef, type ChangeEvent, type ComponentProps } from 'react'
import { EASE_OUT, prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'>

/**
 * Круглый чекбокс Галки: нативный input (доступность) поверх визуального круга 26 px,
 * хит-зона 44 px. Заливка с пружиной и прорисовка галочки — CSS-переходы (.g-check в globals.css),
 * всплеск-кольцо и свечение — WAAPI только в момент отметки, не при загрузке.
 */
export function Checkbox({ className, onChange, ...props }: CheckboxProps) {
  const burstRef = useRef<HTMLSpanElement>(null)
  const boxRef = useRef<HTMLSpanElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.checked && !prefersReducedMotion()) {
      burstRef.current?.animate(
        [
          { transform: 'scale(1)', opacity: 0.6 },
          { transform: 'scale(1.9)', opacity: 0 },
        ],
        { duration: 300, easing: EASE_OUT },
      )
      boxRef.current?.animate(
        [{ filter: 'drop-shadow(0 0 8px var(--g-accent-glow))' }, { filter: 'drop-shadow(0 0 0 transparent)' }],
        { duration: 400, easing: 'ease-out' },
      )
      if (window.matchMedia('(pointer: coarse)').matches) navigator.vibrate?.(8)
    }
    onChange?.(event)
  }

  return (
    <span className={cn('g-check', className)}>
      <input type="checkbox" data-slot="checkbox" className="g-check__input" onChange={handleChange} {...props} />
      <span ref={boxRef} aria-hidden="true" className="g-check__box">
        <span ref={burstRef} className="g-check__burst" />
        <span className="g-check__fill" />
        <svg viewBox="0 0 26 26" className="g-check__mark">
          <path d="M7.5 13.5l3.75 3.75L18.75 9" pathLength={20} />
        </svg>
      </span>
    </span>
  )
}
