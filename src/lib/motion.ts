/** true, если пользователь просит меньше движения: JS-анимации (WAAPI, конфетти, shake) не запускаем. */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

/** Те же кривые, что токены --ease-* в globals.css, — для WAAPI (var() там не работает). */
export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const EASE_SPRING =
  'linear(0, 0.06 3%, 0.24 7%, 0.52 12%, 0.8 18%, 0.97 24%, 1.05 30%, 1.07 35%, 1.05 42%, 1.01 52%, 0.995 62%, 1 80%, 1)'
