import { describe, expect, it } from 'vitest'
import { formatRemaining, formatTaskCount } from './plural'

describe('плюрализация', () => {
  it.each([
    [0, '0 задач'],
    [1, '1 задача'],
    [2, '2 задачи'],
    [4, '4 задачи'],
    [5, '5 задач'],
    [11, '11 задач'],
    [12, '12 задач'],
    [14, '14 задач'],
    [21, '21 задача'],
    [22, '22 задачи'],
    [25, '25 задач'],
    [101, '101 задача'],
    [111, '111 задач'],
    [112, '112 задач'],
  ])('%i → %s', (n, expected) => {
    expect(formatTaskCount(n)).toBe(expected)
  })

  it('согласует глагол', () => {
    expect(formatRemaining(1)).toBe('Осталась 1 задача')
    expect(formatRemaining(21)).toBe('Осталась 21 задача')
    expect(formatRemaining(3)).toBe('Осталось 3 задачи')
    expect(formatRemaining(5)).toBe('Осталось 5 задач')
  })
})
