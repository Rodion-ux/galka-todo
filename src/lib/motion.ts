/** true, если пользователь просит меньше движения: ждать анимаций выхода не нужно. */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

/** Длительность схлопывания строки: --dur-1 (прозрачность) + --dur-2 (высота). */
export const ROW_EXIT_MS = 120 + 180
