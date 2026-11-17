/**
 * Общие классы поверхностей и контролов из Krivo.
 * Только токены, без hex.
 *
 * Отличие от Krivo: контролы здесь лежат на карточке (bg-card), а не на «столе»
 * (bg-background), поэтому активный сегмент — bg-card, а в тёмной теме трек
 * темнее карточки, иначе сегменты сливаются с фоном.
 */
export const KRIVO_SURFACE =
  'rounded-[24px] border border-figma-surface-secondary bg-card shadow-card dark:border-border'

export const KRIVO_SEGMENTED =
  'inline-flex h-10 items-center gap-0.5 rounded-[12px] bg-figma-surface-secondary p-0.5 dark:bg-background'

export const KRIVO_SEGMENTED_BUTTON =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-transparent px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground active:translate-y-px'

export const KRIVO_SEGMENTED_BUTTON_ACTIVE =
  'border-border bg-card text-foreground shadow-soft dark:bg-figma-surface-tertiary'

/** Ховер строки: в тёмной теме surface-secondary совпадает с карточкой. */
export const KRIVO_ROW_HOVER = 'hover:bg-figma-surface-secondary dark:hover:bg-secondary'
