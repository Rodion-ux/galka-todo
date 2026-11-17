# Галка — список задач

Простой to-do на Next.js 16 + Tailwind v4, визуальная база из `Rodion-ux/krivo-dashboard`.
Подробности — `ARCHITECTURE.md`.

## Правила

- Весь UI-текст на русском.
- Иконки только через `@/lib/icons`, классы через `cn()` из `@/lib/utils`.
- Цвета только токенами из `globals.css` (`bg-figma-*`, `text-figma-*`, `bg-background`, `bg-card`…), без hex в TSX.
- Компоненты < 150 строк, один на файл, `'use client'` только там, где нужна интерактивность.
- Состояние задач — только через `src/lib/tasks/store.ts` и хук `useTasks`.

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
