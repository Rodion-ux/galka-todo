import { EASE_OUT, prefersReducedMotion } from '@/lib/motion'

const COLORS = ['var(--g-accent)', 'var(--g-cobalt)', 'var(--g-orange)']
const COUNT = 14

/**
 * Конфетти-лайт §4.6: 14 частиц веером вверх из origin, вращение, падение с затуханием.
 * Чистый WAAPI, частицы удаляются по окончании. При reduced motion не запускается.
 */
export function burstConfetti(origin: HTMLElement) {
  if (prefersReducedMotion()) return
  for (let i = 0; i < COUNT; i++) {
    const piece = document.createElement('span')
    const strip = i % 3 === 0
    const angle = (-150 + (120 * i) / (COUNT - 1) + (Math.random() * 12 - 6)) * (Math.PI / 180)
    const distance = 60 + Math.random() * 80
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance
    const spin = (90 + Math.random() * 270) * (Math.random() < 0.5 ? -1 : 1)
    Object.assign(piece.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: strip ? '3px' : '6px',
      height: strip ? '10px' : '6px',
      borderRadius: '1px',
      background: COLORS[i % COLORS.length],
      pointerEvents: 'none',
    })
    piece.setAttribute('aria-hidden', 'true')
    origin.appendChild(piece)
    piece
      .animate(
        [
          { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${spin * 0.7}deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${x * 1.15}px), calc(-50% + ${y + 40}px)) rotate(${spin}deg)`, opacity: 0 },
        ],
        { duration: 900, easing: EASE_OUT },
      )
      .finished.catch(() => {})
      .finally(() => piece.remove())
  }
}
