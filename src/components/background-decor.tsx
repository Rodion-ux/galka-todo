/** Фон §4.2: лаймовое свечение сверху, миллиметровка вокруг панели, шум. Только декор. */
export function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="g-decor">
      <div className="g-decor__glow" />
      <div className="g-decor__grid" />
      <div className="g-decor__noise" />
    </div>
  )
}
