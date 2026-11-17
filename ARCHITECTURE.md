# Галка — архитектура

> «Галка» — список задач. Название двойное: галочка «сделано» и птица галка (она же на лого).
> Визуальная база — `Rodion-ux/krivo-dashboard` (тёплая нейтральная палитра, `ty-*` типографика, токены `--figma-*`, светлая и тёмная тема).

## 1. Требования

Обязательные (из ТЗ):
1. Создать задачу.
2. Отметить задачу выполненной (и снять отметку).
3. Удалить задачу.
4. Задачи сохраняются после перезагрузки страницы.

Дополнительно, малой ценой:
- фильтр «Все / Активные / Готово» и счётчик оставшихся;
- «Очистить выполненные»;
- переключатель темы (светлая/тёмная/системная), как в Krivo;
- синхронизация между вкладками (событие `storage`).

Вне рамок: бэкенд, авторизация, дедлайны, приоритеты, drag-and-drop, редактирование текста задачи.

## 2. Стек

| Слой | Выбор | Почему |
|---|---|---|
| Фреймворк | Next.js 16 (App Router), React 19, TypeScript strict | как в Krivo, нативно на Vercel |
| Стили | Tailwind CSS v4 + CSS-переменные (урезанный `globals.css` из Krivo) | переносим визуальный язык один в один |
| Шрифт | `geist` (GeistSans, GeistMono) | как в Krivo |
| Иконки | `lucide-react`, но **только через** `src/lib/icons.ts` | правило Krivo |
| Утилиты | `clsx` + `tailwind-merge` → `cn()` | правило Krivo |
| Состояние | собственный внешний стор + `useSyncExternalStore` | 0 зависимостей, корректный SSR/гидрация |
| Хранение | `localStorage`, ключ `galka:tasks:v1` | ТЗ п.4, без бэкенда |
| Тесты | Vitest (юнит для стора/хранилища) + Playwright smoke (QA) | |

shadcn/base-ui **не тащим**: на одну страницу это лишний вес; кнопка, чекбокс и инпут пишутся вручную в стиле Krivo (классы из `krivo-dashboard/src/components/ui/button.tsx` и `checkbox.tsx`).

## 3. Структура

```
src/
  app/
    layout.tsx          — html lang="ru", шрифты, метаданные, favicon, ThemeInitScript
    page.tsx            — серверный компонент, рендерит <TodoApp/>
    globals.css         — токены Krivo (light + .dark), ty-* утилиты, reduced-motion
    icon.svg            — лого (favicon)
  components/
    todo-app.tsx        — 'use client', композиция экрана
    app-header.tsx      — лого + название + ThemeToggle
    task-composer.tsx   — форма добавления (input + кнопка)
    task-filters.tsx    — сегмент-контрол Все/Активные/Готово + счётчик + «Очистить выполненные»
    task-list.tsx       — список + пустые состояния
    task-item.tsx       — строка: чекбокс, текст, кнопка удаления
    theme-toggle.tsx
    ui/button.tsx, ui/checkbox.tsx, ui/input.tsx
  lib/
    tasks/
      types.ts          — Task, Filter
      storage.ts        — load/save + валидация, безопасно при отсутствии localStorage
      store.ts          — внешний стор: getSnapshot/subscribe/actions
      use-tasks.ts      — хук поверх useSyncExternalStore
      store.test.ts     — Vitest
      storage.test.ts
    icons.ts            — re-export нужных иконок lucide
    utils.ts            — cn()
    theme.ts            — чтение/запись темы, init-скрипт
public/
  logo.svg
```

Компоненты держим < 150 строк, по одному на файл.

## 4. Модель данных

```ts
type Task = {
  id: string          // crypto.randomUUID(), с фолбэком на Date.now()+Math.random()
  title: string       // trim, 1..200 символов
  done: boolean
  createdAt: number   // ms epoch
}
type Filter = 'all' | 'active' | 'done'
```

В хранилище лежит `{ version: 1, tasks: Task[] }`. Порядок: новые сверху.

## 5. Состояние и сохранение

```
UI ──actions──▶ store (in-memory Task[]) ──save──▶ localStorage
 ▲                    │                              │
 └─useSyncExternalStore◀─notify──────────── storage event (другая вкладка)
```

- `store.ts` хранит массив в памяти, экшены `add(title)`, `toggle(id)`, `remove(id)`, `clearDone()` создают **новый** массив (иммутабельно), пишут в storage и оповещают подписчиков.
- `getServerSnapshot` возвращает стабильный пустой массив, клиент при первом рендере тоже (`hydrated=false`), чтобы не было рассинхрона при гидрации. После монтирования стор лениво грузит storage и выставляет `hydrated=true`. Пока `hydrated=false`, показываем скелетон списка, а не пустое состояние, иначе на долю секунды мелькнёт «Задач нет».
- `storage.ts`:
  - `JSON.parse` в try/catch; битые или чужие данные → пустой список, без падения; невалидные элементы отбрасываются поштучно (проверка типов полей);
  - доступ к `localStorage` в try/catch (приватный режим, отключённые куки, переполнение квоты) → работаем в памяти, приложение не падает;
  - подписка на `window` `storage` по ключу → перечитать и оповестить (синк вкладок).
- Фильтр — локальный `useState` в `TodoApp`, в storage не пишется.

## 6. UI / дизайн (по Krivo)

- Фон страницы `bg-background` (тёплый «стол» `#edece8`), центральная карточка `rounded-[24px] bg-card border border-figma-surface-secondary`, max-w ~640px, отступы 16px на мобиле.
- Заголовок: лого 32px + «Галка» (`ty-page-title`) + подзаголовок `ty-subtitle`, например «Отмечай и забывай».
- Composer: инпут `h-10 rounded-xl bg-figma-surface-secondary`, кнопка primary `bg-foreground text-background rounded-xl h-10` с иконкой Plus. Enter отправляет. Пустой ввод: кнопка disabled. Автофокус на десктопе, после добавления фокус остаётся в поле.
- Строка задачи: `rounded-[10px]`, hover `bg-figma-surface-secondary`; чекбокс как в Krivo (`size-5 rounded-[6px]`); выполненная задача: `line-through text-figma-body-muted`; кнопка удаления (Trash2, ghost, 32px) видна на hover/focus-within на десктопе и всегда на тач-устройствах (`@media (hover:none)`).
- Фильтры: сегмент-контрол `KRIVO_SEGMENTED` (`h-10 rounded-[12px] bg-figma-surface-secondary p-0.5`, активный `bg-background`).
- Пустые состояния: нет задач вообще / нет активных («Всё сделано 🎉» без эмодзи-перегруза) / нет выполненных.
- Анимации: появление и удаление строки через opacity/transform, 150–200ms, ease-out, с уважением `prefers-reduced-motion` (блок из Krivo `globals.css`).
- A11y: `<form>` с `<label class="sr-only">`, чекбокс — настоящий `<input type="checkbox">` (стилизованный) или `role="checkbox"` с клавиатурой; кнопка удаления с `aria-label="Удалить «…»"`; список `<ul>`; `aria-live="polite"` для счётчика; видимый focus-visible ring.
- Весь UI-текст на русском, со склонениями: «1 задача / 2 задачи / 5 задач».

## 7. Краевые случаи (обязательно покрыть)

| Случай | Поведение |
|---|---|
| Пустой или пробельный ввод | не добавляется, кнопка disabled |
| > 200 символов | `maxLength=200` в инпуте + обрезка в сторе |
| Длинное слово без пробелов | `break-words` / `overflow-wrap:anywhere`, без горизонтального скролла |
| Битый JSON в localStorage | пустой список, без падения, следующая запись перезаписывает |
| localStorage недоступен | работа в памяти, без падения |
| Две вкладки | изменения из одной появляются в другой |
| Быстрый двойной Enter | две задачи, если ввод не пуст после первой (поле очищается сразу) |
| SSR/гидрация | нет hydration warning; до загрузки — скелетон |
| Тёмная тема | без вспышки светлой темы (init-скрипт в `<head>`) |

## 8. Качество

- `npm run typecheck` (tsc --noEmit), `npm run lint`, `npm test` (vitest), `npm run build` — всё зелёное перед деплоем.
- Юнит-тесты: add/trim/empty/maxlen, toggle, remove, clearDone, иммутабельность, storage с битым JSON / невалидными элементами / бросающим localStorage.
- QA (Playwright, отдельный агент): сценарии ТЗ 1–4 + перезагрузка + мобильная ширина 375px + тёмная тема.

## 9. Деплой

Vercel, preview-деплой через CLI, без Git-интеграции. Команды — в `CLAUDE.md`, раздел «Деплой».

## 10. Распределение работы

| Исполнитель | Задача |
|---|---|
| Opus 5.5 (оркестратор) | архитектура, лого (AI Box), репозиторий, деплой, приёмка |
| Opus 5.5 (агент-разработчик) | скаффолд, стор/хранилище, все компоненты, юнит-тесты |
| Sonnet 5.5 (агент QA) | e2e-прогон в Playwright, проверка краевых случаев, README |
