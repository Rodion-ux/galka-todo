import { expect, test, type Page } from '@playwright/test'

const STORAGE_KEY = 'galka:tasks:v1'

const input = (page: Page) => page.getByPlaceholder('Что нужно сделать?')
const addButton = (page: Page) => page.getByRole('button', { name: 'Добавить' })
const items = (page: Page) => page.getByRole('list', { name: 'Задачи' }).getByRole('listitem')

async function add(page: Page, title: string) {
  await input(page).fill(title)
  await input(page).press('Enter')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(input(page)).toBeVisible()
})

test.describe('ТЗ 1: создание', () => {
  test('Enter и кнопка создают задачи', async ({ page }) => {
    await add(page, 'Купить молоко')
    await expect(items(page)).toHaveCount(1)
    await expect(input(page)).toHaveValue('')

    await input(page).fill('Написать тесты')
    await addButton(page).click()
    await expect(items(page)).toHaveCount(2)
    await expect(page.getByRole('checkbox', { name: 'Написать тесты' })).toBeVisible()
  })

  test('пустой и пробельный ввод не создаёт задачу', async ({ page }) => {
    await expect(addButton(page)).toBeDisabled()
    await input(page).fill('   ')
    await expect(addButton(page)).toBeDisabled()
    await input(page).press('Enter')
    await expect(items(page)).toHaveCount(0)
    await expect(page.getByText('Задач пока нет')).toBeVisible()
  })
})

test('ТЗ 2: отметка и снятие отметки', async ({ page }) => {
  await add(page, 'Задача')
  const box = page.getByRole('checkbox', { name: 'Задача' })
  await box.check()
  await expect(box).toBeChecked()
  await box.uncheck()
  await expect(box).not.toBeChecked()
})

test('ТЗ 3: удаление', async ({ page }) => {
  await add(page, 'Лишняя')
  await add(page, 'Нужная')
  await page.getByRole('button', { name: 'Удалить «Лишняя»' }).click({ force: true })
  await expect(items(page)).toHaveCount(1)
  await expect(page.getByRole('checkbox', { name: 'Нужная' })).toBeVisible()
})

test('ТЗ 4: после reload задачи и статус на месте', async ({ page }) => {
  await add(page, 'Первая')
  await add(page, 'Вторая')
  await page.getByRole('checkbox', { name: 'Первая' }).check()
  await page.reload()
  await expect(items(page)).toHaveCount(2)
  await expect(page.getByRole('checkbox', { name: 'Первая' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Вторая' })).not.toBeChecked()
})

test('фильтры, счётчик со склонением и очистка выполненных', async ({ page }) => {
  const counter = page.locator('p[aria-live="polite"]')
  await add(page, 'А')
  await expect(counter).toHaveText('Осталась 1 задача')
  await add(page, 'Б')
  await expect(counter).toHaveText('Осталось 2 задачи')
  for (const t of ['В', 'Г', 'Д']) await add(page, t)
  await expect(counter).toHaveText('Осталось 5 задач')

  await page.getByRole('checkbox', { name: 'А' }).check()
  await page.getByRole('checkbox', { name: 'Б' }).check()
  await expect(counter).toHaveText('Осталось 3 задачи')

  await page.getByRole('button', { name: /^Активные/ }).click()
  await expect(items(page)).toHaveCount(3)
  await page.getByRole('button', { name: /^Готово/ }).click()
  await expect(items(page)).toHaveCount(2)
  await page.getByRole('button', { name: /^Все/ }).click()
  await expect(items(page)).toHaveCount(5)

  await page.getByRole('button', { name: 'Очистить выполненные' }).click()
  await expect(items(page)).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Очистить выполненные' })).toHaveCount(0)
})

test('битый JSON в localStorage: пустое состояние, дальше работает', async ({ page }) => {
  await page.evaluate((k) => localStorage.setItem(k, '{не json['), STORAGE_KEY)
  await page.reload()
  await expect(page.getByText('Задач пока нет')).toBeVisible()
  await add(page, 'После поломки')
  await expect(items(page)).toHaveCount(1)
  const raw = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)
  expect(() => JSON.parse(raw ?? '')).not.toThrow()
})

test('синхронизация двух вкладок', async ({ context, page }) => {
  const second = await context.newPage()
  await second.goto('/')
  await expect(input(second)).toBeVisible()

  await add(page, 'Из первой вкладки')
  await expect(second.getByRole('checkbox', { name: 'Из первой вкладки' })).toBeVisible()

  await second.getByRole('checkbox', { name: 'Из первой вкладки' }).check()
  await expect(page.getByRole('checkbox', { name: 'Из первой вкладки' })).toBeChecked()
})

test('длинное слово 200 символов на 375px: нет горизонтального скролла', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await add(page, 'ы'.repeat(200))
  await expect(items(page)).toHaveCount(1)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('тёмная тема переживает reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Тёмная тема' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: 'Тёмная тема' })).toHaveAttribute('aria-pressed', 'true')
})

test('нет ошибок в консоли', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await add(page, 'Проверка')
  await page.getByRole('checkbox', { name: 'Проверка' }).check()
  await page.getByRole('button', { name: 'Тёмная тема' }).click()
  await page.getByRole('button', { name: 'Удалить «Проверка»' }).click({ force: true })
  await page.reload()
  expect(errors).toEqual([])
})
