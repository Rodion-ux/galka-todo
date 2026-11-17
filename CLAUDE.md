# pensum — список задач

Простой to-do на Next.js 16 + Tailwind v4. Дизайн — «Бумага и чернила» по `docs/design/BRIEF-v2.md`
(закон — `docs/design/FEEDBACK-2.md`; старый `docs/design/BRIEF.md` не действует). Подробности — `ARCHITECTURE.md`.

## Правила

- Весь UI-текст на русском. Название — `pensum`: строчными, латиницей, без кавычек (`PRODUCT_NAME` в `lib/brand.ts`).
- Иконки только через `@/lib/icons`, классы через `cn()` из `@/lib/utils`.
- Тема одна — светлая. Никаких `dark:`, `[data-theme]`, `prefers-color-scheme`, переключателей темы. Старый ключ темы в localStorage просто игнорируется.
- Цвета только токенами `--p-*` из `globals.css` (`bg-p-paper`, `text-p-ink-2`, `border-p-line`, `bg-p-accent`…), без hex в TSX.
- Акцент (киноварь `--p-accent`) — только «сделано»: заливка отмеченного чекбокса, заполненные сегменты степпера и подсветка строк, которые удалит «Удалить выполненные» (`--p-accent-tint`). Не в кнопках, ссылках, фокусе и декоре. Действие и выбор — чернилами (`--p-ink`).
- Запрещено: неон, свечения/ореолы, цветные тени, градиенты, сетка/шум на фоне, `backdrop-filter`/blur, конфетти, display-шрифты, моноширинная мета и капс. Единственная тень — у тоста (`--p-toast-shadow`).
- Шрифты (только `next/font/google`): Golos Text (`font-sans`, latin+cyrillic, 400/500) — весь интерфейс; Source Serif 4 Semibold (`font-brand`, только latin) — только вордмарк `pensum`. Новых шрифтов не добавлять. Числа — `tabular-nums`.
- Анимации: только CSS, короткие и функциональные; длительности `--dur-1/2/3` (120/180/240 мс), кривые `--ease-out`/`--ease-in`. Анимировать только transform/opacity/stroke-dashoffset/grid-template-rows/background-size/color, без `transition: all`, без пружин и overshoot. `prefers-reduced-motion` — движения нет.
- Хит-зона интерактивных элементов ≥ 44px (утилита `p-hit`). Фокус — нейтральное кольцо `outline: 2px solid var(--p-ink)`, offset 2px; у поля ввода — рамка чернилами, в тосте — кольцо `--p-surface`.
- Знак: форма в `components/logo-mark.tsx` (currentColor), цвет и размер задаёт обёртка. Фавикон — `public/logo.svg`.
- Компоненты < 150 строк, один на файл, `'use client'` только там, где нужна интерактивность.
- Состояние задач — только через `src/lib/tasks/store.ts` и хук `useTasks`; undo удаления — через `lib/tasks/undo.ts` и `useUndo`.

## Команды

```bash
npm run dev        # dev-сервер
npm run typecheck  # tsc --noEmit
npm run lint
npm test           # vitest
npm run build
```

## Деплой

Vercel, аккаунт/скоуп `eugenes-projects-01ff4fd9`, проект `galka-todo`. Пока только preview, без Git-интеграции.

```bash
npm run typecheck && npm test && npm run build
npx vercel deploy --yes --scope eugenes-projects-01ff4fd9
```

Первый раз проект линкуется так: `npx vercel link --yes --project galka-todo --scope eugenes-projects-01ff4fd9`.
