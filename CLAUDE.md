# Галка — список задач

Простой to-do на Next.js 16 + Tailwind v4. Дизайн — «Ночная галка / Acid Ink» по `docs/design/BRIEF.md`.
Подробности — `ARCHITECTURE.md`.

## Правила

- Весь UI-текст на русском.
- Иконки только через `@/lib/icons`, классы через `cn()` из `@/lib/utils`.
- Цвета только токенами `--g-*` из `globals.css` (`bg-g-row`, `text-g-muted`, `bg-g-accent`, `text-g-accent-text`…), без hex в TSX. Лайм (`--g-accent`) — только «отмечено» и «добавить»; на светлой теме лайм не бывает текстом (для текста `--g-accent-text`). Деструктивное — `--g-danger`.
- Тема по умолчанию тёмная (`DEFAULT_THEME` в `lib/theme.ts`); светлая строится на тех же токенах, не инверсией.
- Шрифты: Unbounded (`font-display`, через `next/font/google`) — только вордмарк, счётчик, заголовки пустых состояний; остальное Geist Sans / Geist Mono. Новых шрифтов не добавлять.
- Анимации: CSS + WAAPI, без библиотек; кривые/длительности — токены `--ease-*`/`--dur-*` (для WAAPI — `lib/motion.ts`). Анимировать только transform/opacity/filter/stroke-dashoffset/grid-rows, без `transition: all`. JS-анимации запускать только если `!prefersReducedMotion()`.
- Хит-зона интерактивных элементов ≥ 44px (утилита `g-hit`), фокус — кобальтовое кольцо.
- Знак: форма в `components/logo-mark.tsx` (currentColor), цвет задаёт обёртка.
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
