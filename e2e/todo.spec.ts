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
const counter = (page: Page) => page.getByRole('status', { name: /^Выполнено \d+ из \d+$/ })
const progress = (page: Page) => page.getByRole('progressbar', { name: 'Прогресс дня' })
const undoButton = (page: Page) => page.getByRole('button', { name: 'Вернуть' })
const toast = (page: Page) => page.getByRole('status').filter({ hasText: 'Вернуть' })
const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true })
const clearDone = (page: Page) => page.getByRole('button', { name: /^Удалить выполненные задачи: \d+$/ })
const del = (page: Page, title: string) => page.getByRole('button', { name: `Удалить «${title}»` })
const check = (page: Page, title: string) => page.getByRole('checkbox', { name: title, exact: true })
const emptyText = (page: Page, text: string) => page.getByText(text, { exact: true })

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

/** Хит-зона ≥ 44×44: может быть псевдоэлементом (не входит в boundingBox), поэтому проверяем elementFromPoint на кресте 44×44 вокруг центра. */
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
      return !!hit && (node === hit || node.contains(hit) || hit.contains(node) || (node.parentElement?.contains(hit) ?? false))
    })
  }, size)
  expect(ok, `${label}: должен ловить клики в квадрате 44×44`).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(input(page)).toBeVisible()
  await expect(emptyText(page, 'Список пуст.')).toBeVisible()
})

test.describe('ТЗ: базовые сценарии', () => {
  test('Enter и кнопка создают задачи', async ({ page }) => {
    await add(page, 'Купить молоко')
    await expect(items(page)).toHaveCount(1)
    await expect(input(page)).toHaveValue('')

    await input(page).fill('Написать тесты')
    await expect(addButton(page)).toHaveText('Добавить')
    await addButton(page).click()
    await expect(items(page)).toHaveCount(2)
    await expect(check(page, 'Написать тесты')).toBeVisible()
  })

  test('пустой и пробельный ввод не создаёт задачу', async ({ page }) => {
    await expect(addButton(page)).toHaveAttribute('aria-disabled', 'true')
    await addButton(page).click({ force: true })
    await input(page).fill('   ')
    await expect(addButton(page)).toHaveAttribute('aria-disabled', 'true')
    await input(page).press('Enter')
    await addButton(page).click({ force: true })
    await expect(items(page)).toHaveCount(0)
    await expect(emptyText(page, 'Список пуст.')).toBeVisible()
    await input(page).fill('x')
    await expect(addButton(page)).toHaveAttribute('aria-disabled', 'false')
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

  test('Ctrl+Z возвращает удалённую задачу', async ({ page }) => {
    await add(page, 'А')
    await add(page, 'Б')
    const before = await titles(page)
    await remove(page, 'А')
    await expect(items(page)).toHaveCount(1)
    await page.keyboard.press('Control+z')
    await expect(items(page)).toHaveCount(2)
    expect(await titles(page)).toEqual(before)
    await page.reload()
    expect(await titles(page)).toEqual(before)
  })

  test('«Удалить выполненные» → «Вернуть» возвращает все, переживает reload', async ({ page }) => {
    for (const t of ['А', 'Б', 'В', 'Г']) await add(page, t)
    await check(page, 'Б').check()
    await check(page, 'Г').check()
    const before = await titles(page)

    await expect(clearDone(page)).toHaveText('Удалить выполненные · 2')
    await clearDone(page).click()
    await expect(items(page)).toHaveCount(2)
    await expect(toast(page)).toContainText('Удалено выполненных: 2')
    await undoButton(page).click()
    await expect(items(page)).toHaveCount(4)
    expect(await titles(page)).toEqual(before)
    await expect(check(page, 'Б')).toBeChecked()
    await expect(check(page, 'Г')).toBeChecked()

    await page.reload()
    expect(await titles(page)).toEqual(before)
    await expect(check(page, 'Г')).toBeChecked()
  })

  test('«Удалить выполненные» → Ctrl+Z', async ({ page }) => {
    for (const t of ['А', 'Б', 'В']) await add(page, t)
    await check(page, 'А').check()
    await check(page, 'В').check()
    const before = await titles(page)
    await clearDone(page).click()
    await expect(items(page)).toHaveCount(1)
    await page.keyboard.press('Control+z')
    await expect(items(page)).toHaveCount(3)
    expect(await titles(page)).toEqual(before)
    await expect(check(page, 'А')).toBeChecked()
  })

  test('подсветка удаляемых строк на hover/focus кнопки «Удалить выполненные»', async ({ page }) => {
    for (const t of ['А', 'Б']) await add(page, t)
    await check(page, 'А').check()
    await page.mouse.move(5, 5)
    const bg = (title: string) =>
      page.getByRole('listitem').filter({ has: check(page, title) }).locator('.p-row').evaluate((n) => getComputedStyle(n).backgroundColor)
    const before = await bg('А')
    await clearDone(page).hover()
    await expect.poll(() => bg('А')).not.toBe(before)
    expect(await bg('Б')).toBe(before)
    await page.mouse.move(5, 5)
    await expect.poll(() => bg('А')).toBe(before)
    // focus-visible: фокус должен прийти с клавиатуры
    await items(page).last().getByRole('button').focus()
    await page.keyboard.press('Tab')
    await expect(clearDone(page)).toBeFocused()
    await expect.poll(() => bg('А')).not.toBe(before)
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
  test('aria-valuetext и status-счётчик меняются', async ({ page }) => {
    await add(page, 'А')
    await add(page, 'Б')
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 0 из 2')
    await expect(counter(page)).toHaveAccessibleName('Выполнено 0 из 2')
    await expect(counter(page)).toContainText('0/2')

    await check(page, 'А').check()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 1 из 2')
    await expect(counter(page)).toHaveAccessibleName('Выполнено 1 из 2')

    await check(page, 'Б').check()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 2 из 2')
    await expect(counter(page)).toHaveAccessibleName('Выполнено 2 из 2')

    await check(page, 'Б').uncheck()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 1 из 2')
  })

  test('больше 24 задач: прогресс всё ещё корректен', async ({ page }) => {
    for (let i = 1; i <= 26; i++) await add(page, `Задача ${i}`)
    await check(page, 'Задача 1').check()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 1 из 26')
  })
})

test.describe('Фильтры', () => {
  test('мышью; «Удалить выполненные» пропадает при 0 выполненных', async ({ page }) => {
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

  test('имена фильтров без чисел; пустые состояния', async ({ page }) => {
    await expect(emptyText(page, 'Список пуст.')).toBeVisible()
    await add(page, 'А')
    for (const n of ['Все', 'Активные', 'Готово']) await expect(radio(page, n)).toBeVisible()

    await radio(page, 'Готово').click()
    await expect(emptyText(page, 'Выполненных пока нет.')).toBeVisible()

    await radio(page, 'Все').click()
    await check(page, 'А').check()
    await radio(page, 'Активные').click()
    await expect(emptyText(page, 'Активных задач нет.')).toBeVisible()
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
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('INPUT')

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

  test('«Удалить выполненные» с клавиатуры: фокус не в body', async ({ page }) => {
    await add(page, 'А')
    await check(page, 'А').check()
    await clearDone(page).focus()
    await page.keyboard.press('Enter')
    await expect(items(page)).toHaveCount(0)
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY')
  })
})

test.describe('Хранилище и синхронизация', () => {
  test('битый JSON в localStorage: пустое состояние, дальше работает', async ({ page }) => {
    await page.evaluate((k) => localStorage.setItem(k, '{не json['), STORAGE_KEY)
    await page.reload()
    await expect(emptyText(page, 'Список пуст.')).toBeVisible()
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

test.describe('Регрессия фидбэка (FEEDBACK-2)', () => {
  async function expectClean(page: Page) {
    const text = await page.locator('body').innerText()
    for (const bad of ['Добрый', 'Доброе', 'Осталось', 'Осталась', 'хранятся только', 'всё сделано', 'Тема оформления']) {
      expect(text.toLowerCase(), `на странице не должно быть «${bad}»`).not.toContain(bad.toLowerCase())
    }
    await expect(page.getByRole('group', { name: 'Тема оформления' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /тем[аы]|Как в системе/i })).toHaveCount(0)
  }

  test('пустая страница, со списком и при всех выполненных', async ({ page }) => {
    await expectClean(page)
    await add(page, 'А')
    await add(page, 'Б')
    await expectClean(page)
    await check(page, 'А').check()
    await check(page, 'Б').check()
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 2 из 2')
    await expectClean(page)
    await radio(page, 'Активные').click()
    await expectClean(page)
  })

  test('нет тёмной темы, Unbounded и моно-шрифтов; title содержит pensum', async ({ page }) => {
    await add(page, 'А')
    await check(page, 'А').check()
    await expect(page).toHaveTitle(/pensum/)
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined()

    const fams = await page.evaluate(() => {
      const set = new Set<string>()
      document.querySelectorAll('*').forEach((el) => set.add(getComputedStyle(el).fontFamily))
      return [...set]
    })
    for (const f of fams) expect(f, 'font-family').not.toMatch(/unbounded|mono|courier|consolas/i)

    const faces = await page.evaluate(async () => {
      await document.fonts.ready
      return [...document.fonts].map((f) => f.family)
    })
    for (const f of faces) expect(f, 'document.fonts').not.toMatch(/unbounded|mono/i)

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    const [r, g, b] = bg.match(/\d+/g)!.map(Number)
    expect(r + g + b, 'фон остаётся светлым').toBeGreaterThan(600)
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
    await expect(progress(page)).toHaveAttribute('aria-valuetext', 'Выполнено 2 из 2')
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
    await expectHitArea(clearDone(page), 'удалить выполненные')
    const row = await items(page).first().boundingBox()
    expect(row!.height).toBeGreaterThanOrEqual(44)
  })

  test('удаление тапом и undo на мобильном', async ({ page }) => {
    await add(page, 'А')
    await del(page, 'А').tap()
    await expect(items(page)).toHaveCount(0)
    await undoButton(page).tap()
    await expect(items(page)).toHaveCount(1)
  })
})
