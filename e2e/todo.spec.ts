import { expect, test as base, type Locator, type Page } from '@playwright/test'

const STORAGE_KEY = 'galka:tasks:v1'

/** Общий fixture: любой console.error / pageerror в тесте валит его. */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', (e) => errors.push(e.message))
      await use(errors)
      expect(errors, 'ошибки консоли / pageerror').toEqual([])
    },
    { auto: true },
  ],
})

const input = (page: Page) => page.getByRole('textbox', { name: 'Новая задача' })
const addButton = (page: Page) => page.getByRole('button', { name: 'Добавить задачу' })
const items = (page: Page) => page.getByRole('list', { name: 'Задачи' }).getByRole('listitem')
const counter = (page: Page) => page.locator('p[aria-live="polite"]')
const progress = (page: Page) => page.getByRole('progressbar', { name: 'Прогресс дня' })
const emptyTitle = (page: Page) => page.locator('.ty-empty-title')
const undoButton = (page: Page) => page.getByRole('button', { name: 'Вернуть' })
const toast = (page: Page) => page.getByRole('status').filter({ has: undoButton(page) })
const radio = (page: Page, name: string) => page.getByRole('radio', { name: new RegExp(`^${name}`) })
const clearDone = (page: Page) => page.getByRole('button', { name: 'Очистить выполненные' })
const del = (page: Page, title: string) => page.getByRole('button', { name: `Удалить «${title}»` })
const check = (page: Page, title: string) => page.getByRole('checkbox', { name: title, exact: true })

async function add(page: Page, title: string) {
  await input(page).fill(title)
  await input(page).press('Enter')
}

/** Удаление мышью: на десктопе кнопка видна по hover строки. */
async function remove(page: Page, title: string) {
  await check(page, title).hover()
  await del(page, title).click()
}

async function titles(page: Page) {
  return (await items(page).allInnerTexts()).map((t) => t.trim())
}

/** Хит-зона ≥ 44×44: ::before у g-hit не входит в boundingBox, поэтому проверяем, что на краях креста 44×44 вокруг центра (круглый чекбокс — вписанный круг) попадаем в сам элемент. */
async function expectHitArea(el: Locator, label: string, size = 44) {
  await el.scrollIntoViewIfNeeded()
  const ok = await el.evaluate((node, s) => {
    const r = node.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const d = s / 2 - 1
    return [
      [-d, 0],
      [d, 0],
      [0, -d],
      [0, d],
      [0, 0],
    ].every(([dx, dy]) => {
      const hit = document.elementFromPoint(cx + dx, cy + dy)
      return !!hit && (node === hit || node.contains(hit))
    })
  }, size)
  expect(ok, `${label}: должен ловить клики в квадрате 44×44`).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(input(page)).toBeVisible()
})

test.describe('ТЗ: базовые сценарии', () => {
  test('Enter и кнопка создают задачи', async ({ page }) => {
    await add(page, 'Купить молоко')
    await expect(items(page)).toHaveCount(1)
    await expect(input(page)).toHaveValue('')

    await input(page).fill('Написать тесты')
    await addButton(page).click()
    await expect(items(page)).toHaveCount(2)
    await expect(check(page, 'Написать тесты')).toBeVisible()
  })

  test('пустой и пробельный ввод не создаёт задачу', async ({ page }) => {
    await expect(input(page)).toHaveAttribute('placeholder', 'Что нужно сделать?')
    await expect(addButton(page)).toBeDisabled()
    await input(page).fill('   ')
    await expect(addButton(page)).toBeDisabled()
    await input(page).press('Enter')
    await expect(items(page)).toHaveCount(0)
    await expect(emptyTitle(page)).toHaveText('Пока пусто')
  })

  test('отметка и снятие отметки', async ({ page }) => {
    await add(page, 'Задача')
    const box = check(page, 'Задача')
    await box.check()
    await expect(box).toBeChecked()
    await box.uncheck()
    await expect(box).not.toBeChecked()
  })

  test('удаление', async ({ page }) => {
    await add(page, 'Лишняя')
    await add(page, 'Нужная')
    await remove(page, 'Лишняя')
    await expect(items(page)).toHaveCount(1)
    await expect(check(page, 'Нужная')).toBeVisible()
    await expect(toast(page)).toContainText('Задача удалена')
  })

  test('после reload задачи и статус на месте', async ({ page }) => {
    await add(page, 'Первая')
    await add(page, 'Вторая')
    await check(page, 'Первая').check()
    await page.reload()
    await expect(items(page)).toHaveCount(2)
    await expect(check(page, 'Первая')).toBeChecked()
    await expect(check(page, 'Вторая')).not.toBeChecked()
  })
})

test.describe('Undo', () => {
  test('удалить → «Вернуть»: задача на прежнем месте со статусом, переживает reload', async ({ page }) => {
    for (const t of ['А', 'Б', 'В']) await add(page, t)
    await check(page, 'Б').check()
    const before = await titles(page)

    await remove(page, 'Б')
    await expect(items(page)).toHaveCount(2)
    await undoButton(page).click()
    await expect(items(page)).toHaveCount(3)
    expect(await titles(page)).toEqual(before)
    await expect(check(page, 'Б')).toBeChecked()
    await expect(undoButton(page)).toHaveCount(0)

    await page.reload()
    expect(await titles(page)).toEqual(before)
    await expect(check(page, 'Б')).toBeChecked()
  })

  test('«Очистить выполненные» → «Вернуть» возвращает все', async ({ page }) => {
    for (const t of ['А', 'Б', 'В', 'Г']) await add(page, t)
    await check(page, 'Б').check()
    await check(page, 'Г').check()
    const before = await titles(page)

    await clearDone(page).click()
    await expect(items(page)).toHaveCount(2)
    await expect(toast(page)).toContainText('Удалено: 2')
    await undoButton(page).click()
    await expect(items(page)).toHaveCount(4)
    expect(await titles(page)).toEqual(before)
    await expect(check(page, 'Б')).toBeChecked()
    await expect(check(page, 'Г')).toBeChecked()
  })

  test('тост исчезает сам через 5 с, пауза на hover', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await add(page, 'Временная')
    await remove(page, 'Временная')
    await expect(undoButton(page)).toBeVisible()

    // Пока курсор над тостом, таймер стоит.
    await undoButton(page).hover()
    await page.clock.runFor(8000)
    await expect(undoButton(page)).toBeVisible()

    // Увели курсор — дожил остаток и ушёл.
    await page.mouse.move(5, 5)
    await page.clock.runFor(6000)
    await expect(undoButton(page)).toHaveCount(0)
  })
})

test.describe('Прогресс', () => {
  test('aria-valuetext меняется, при всех выполненных «Всё сделано»', async ({ page }) => {
    await add(page, 'А')
    await add(page, 'Б')
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 0 из 2')
    await expect(counter(page)).toHaveText('Осталось 2 задачи')

    await check(page, 'А').check()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 1 из 2')
    await expect(counter(page)).toHaveText('Осталась 1 задача')

    await check(page, 'Б').check()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 2 из 2')
    await expect(counter(page)).toHaveText('Всё сделано')

    await check(page, 'Б').uncheck()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 1 из 2')
  })

  test('склонение счётчика', async ({ page }) => {
    for (const t of ['А', 'Б', 'В', 'Г', 'Д']) await add(page, t)
    await expect(counter(page)).toHaveText('Осталось 5 задач')
    await check(page, 'А').check()
    await check(page, 'Б').check()
    await expect(counter(page)).toHaveText('Осталось 3 задачи')
  })

  test('больше 12 задач: прогресс всё ещё корректен', async ({ page }) => {
    for (let i = 1; i <= 13; i++) await add(page, `Задача ${i}`)
    await check(page, 'Задача 1').check()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 1 из 13')
  })
})

test.describe('Фильтры', () => {
  test('мышью + «Очистить выполненные» пропадает при 0 выполненных', async ({ page }) => {
    for (const t of ['А', 'Б', 'В', 'Г', 'Д']) await add(page, t)
    await expect(clearDone(page)).toHaveCount(0)
    await expect(page.getByRole('radiogroup', { name: 'Фильтр задач' })).toBeVisible()
    await expect(radio(page, 'Все')).toHaveAttribute('aria-checked', 'true')

    await check(page, 'А').check()
    await check(page, 'Б').check()
    await radio(page, 'Активные').click()
    await expect(radio(page, 'Активные')).toHaveAttribute('aria-checked', 'true')
    await expect(radio(page, 'Все')).toHaveAttribute('aria-checked', 'false')
    await expect(items(page)).toHaveCount(3)
    await radio(page, 'Готово').click()
    await expect(items(page)).toHaveCount(2)
    await radio(page, 'Все').click()
    await expect(items(page)).toHaveCount(5)

    await clearDone(page).click()
    await expect(items(page)).toHaveCount(3)
    await expect(clearDone(page)).toHaveCount(0)
  })

  test('клавиатура: стрелки, Home, End, Tab заходит только в выбранный', async ({ page }) => {
    await add(page, 'А')
    await radio(page, 'Все').focus()
    await page.keyboard.press('ArrowRight')
    await expect(radio(page, 'Активные')).toHaveAttribute('aria-checked', 'true')
    await expect(radio(page, 'Активные')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(radio(page, 'Готово')).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(radio(page, 'Все')).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(radio(page, 'Готово')).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('Home')
    await expect(radio(page, 'Все')).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('End')
    await expect(radio(page, 'Готово')).toHaveAttribute('aria-checked', 'true')
    await expect(radio(page, 'Все')).toHaveAttribute('tabindex', '-1')
  })

  test('пустые состояния каждого фильтра', async ({ page }) => {
    await expect(emptyTitle(page)).toHaveText('Пока пусто')

    await add(page, 'А')
    await radio(page, 'Готово').click()
    await expect(emptyTitle(page)).toHaveText('Ещё ничего не отмечено')

    await radio(page, 'Все').click()
    await check(page, 'А').check()
    await radio(page, 'Активные').click()
    await expect(emptyTitle(page)).toHaveText('Всё сделано')
  })
})

test.describe('Клавиатура', () => {
  test('Esc очищает поле, «/» фокусирует его', async ({ page }) => {
    await input(page).fill('черновик')
    await input(page).press('Escape')
    await expect(input(page)).toHaveValue('')

    await add(page, 'А')
    await check(page, 'А').focus()
    await page.keyboard.press('/')
    await expect(input(page)).toBeFocused()
    // «/» в самом поле — обычный символ
    await page.keyboard.type('a/b')
    await expect(input(page)).toHaveValue('a/b')
  })

  test('после удаления с клавиатуры фокус не теряется', async ({ page }) => {
    for (const t of ['А', 'Б', 'В']) await add(page, t)
    await del(page, 'Б').focus()
    await page.keyboard.press('Enter')
    await expect(items(page)).toHaveCount(2)
    const tag = await page.evaluate(() => document.activeElement?.tagName)
    expect(tag).not.toBe('BODY')
    expect(tag).toBe('INPUT')

    // Последняя оставшаяся → фокус уходит в поле ввода
    await del(page, 'А').focus()
    await page.keyboard.press('Enter')
    await expect(items(page)).toHaveCount(1)
    await del(page, 'В').focus()
    await page.keyboard.press('Enter')
    await expect(items(page)).toHaveCount(0)
    await expect(input(page)).toBeFocused()
  })

  test('«Вернуть» с клавиатуры возвращает задачу и фокус не уходит в body', async ({ page }) => {
    await add(page, 'А')
    await del(page, 'А').focus()
    await page.keyboard.press('Enter')
    await expect(items(page)).toHaveCount(0)
    await undoButton(page).focus()
    await page.keyboard.press('Enter')
    await expect(items(page)).toHaveCount(1)
    await expect(check(page, 'А')).toBeFocused()
  })
})

test.describe('Хранилище и синхронизация', () => {
  test('битый JSON в localStorage: пустое состояние, дальше работает', async ({ page }) => {
    await page.evaluate((k) => localStorage.setItem(k, '{не json['), STORAGE_KEY)
    await page.reload()
    await expect(emptyTitle(page)).toHaveText('Пока пусто')
    await add(page, 'После поломки')
    await expect(items(page)).toHaveCount(1)
    const raw = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)
    expect(() => JSON.parse(raw ?? '')).not.toThrow()
  })

  test('синхронизация двух вкладок', async ({ context, page }) => {
    const second = await context.newPage()
    second.on('pageerror', (e) => expect.soft(e.message).toBe(''))
    await second.goto('/')
    await expect(input(second)).toBeVisible()

    await add(page, 'Из первой вкладки')
    await expect(check(second, 'Из первой вкладки')).toBeVisible()

    await check(second, 'Из первой вкладки').check()
    await expect(check(page, 'Из первой вкладки')).toBeChecked()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 1 из 1')
  })
})

test.describe('Тема', () => {
  test('по умолчанию тёмная; светлая переживает reload', async ({ page }) => {
    await expect(page.locator('html')).toHaveClass(/dark/)
    const group = page.getByRole('group', { name: 'Тема оформления' })
    await expect(group.getByRole('button', { name: 'Тёмная тема' })).toHaveAttribute('aria-pressed', 'true')

    await group.getByRole('button', { name: 'Светлая тема' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await expect(group.getByRole('button', { name: 'Светлая тема' })).toHaveAttribute('aria-pressed', 'true')
    await expect(group.getByRole('button', { name: 'Как в системе' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('«Как в системе» следует prefers-color-scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.getByRole('button', { name: 'Как в системе' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})

test.describe('prefers-reduced-motion', () => {
  test('отметка, удаление и undo работают без ошибок', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await add(page, 'А')
    await add(page, 'Б')
    await check(page, 'А').check()
    await expect(check(page, 'А')).toBeChecked()
    await check(page, 'Б').check()
    await expect(counter(page)).toHaveText('Всё сделано')
    await remove(page, 'А')
    await expect(items(page)).toHaveCount(1)
    await undoButton(page).click()
    await expect(items(page)).toHaveCount(2)
  })
})

test.describe('Мобильный 375px', () => {
  test.use({ viewport: { width: 375, height: 700 }, hasTouch: true, isMobile: true })

  test('длинное слово 200 символов: нет горизонтального скролла', async ({ page }) => {
    await add(page, 'ы'.repeat(200))
    await expect(items(page)).toHaveCount(1)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    const row = await items(page).first().boundingBox()
    expect(row!.x + row!.width).toBeLessThanOrEqual(375)
  })

  test('кнопка удаления видна без hover, хит-зоны ≥ 44px', async ({ page }) => {
    await add(page, 'А')
    await check(page, 'А').check()
    const trash = del(page, 'А')
    await expect(trash).toBeVisible()
    expect(Number(await trash.evaluate((n) => getComputedStyle(n).opacity))).toBeGreaterThan(0.3)

    await expectHitArea(trash, 'удаление')
    await expectHitArea(check(page, 'А'), 'чекбокс')
    await expectHitArea(addButton(page), 'добавить')
    for (const name of ['Все', 'Активные', 'Готово']) await expectHitArea(radio(page, name), `фильтр ${name}`)
    await expectHitArea(clearDone(page), 'очистить')
    const row = await items(page).first().boundingBox()
    expect(row!.height).toBeGreaterThanOrEqual(56)
  })

  // BUG (не чинится, дизайн-решение): три кнопки темы 30×30 стоят вплотную (шаг 30px), их g-hit-зоны 44px
  // перекрываются, и клик у границы попадает в соседа. BRIEF §6.7 требует ≥44×44 для всех.
  // Воспроизведение: 375px, тап по краю кнопки «Тёмная тема» — срабатывает «Светлая»/«Как в системе».
  // Починка: сделать кнопки 44px (переключатель 132px) или заменить на одну циклическую кнопку.
  test('хит-зоны переключателя темы ≥ 44px', async ({ page }) => {
    for (const name of ['Светлая тема', 'Тёмная тема', 'Как в системе']) {
      await expectHitArea(page.getByRole('button', { name }), name)
    }
  })

  test('удаление тапом и undo на мобильном', async ({ page }) => {
    await add(page, 'А')
    await del(page, 'А').tap()
    await expect(items(page)).toHaveCount(0)
    await undoButton(page).tap()
    await expect(items(page)).toHaveCount(1)
  })
})
