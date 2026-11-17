import { LogoMark } from '@/components/logo-mark'
import { PRODUCT_NAME } from '@/lib/brand'

/** Шапка §5.10: знак и вордмарк, справа ничего. Не липкая. */
export function AppHeader() {
  return (
    <header className="flex h-14 items-center">
      <h1 className="flex items-baseline gap-1.5 text-p-ink">
        {/* Низ круга знака = базовая линия вордмарка, диаметр круга = x-height (BRIEF-v2 §7). */}
        <LogoMark className="-ml-[3px] size-[22px] shrink-0 translate-y-[10px]" />
        <span className="font-brand text-[23px] leading-none font-semibold tracking-[-0.01em]">{PRODUCT_NAME}</span>
      </h1>
    </header>
  )
}
