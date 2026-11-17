import { describe, expect, it } from 'vitest'
import { formatToday, greeting } from './today'

describe('блок «Сегодня»', () => {
  it.each([
    [5, 'Доброе утро'],
    [11, 'Доброе утро'],
    [12, 'Добрый день'],
    [16, 'Добрый день'],
    [17, 'Добрый вечер'],
    [22, 'Добрый вечер'],
    [23, 'Доброй ночи'],
    [0, 'Доброй ночи'],
    [4, 'Доброй ночи'],
  ])('%i ч → %s', (hour, expected) => {
    expect(greeting(hour)).toBe(expected)
  })

  it('дата по-русски: день недели, число, месяц в родительном', () => {
    expect(formatToday(new Date(2026, 10, 17, 12).getTime())).toBe('вт, 17 ноября')
  })
})
