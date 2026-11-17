import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  loadTasks,
  normalizeTitle,
  parseTasks,
  saveTasks,
  serializeTasks,
} from './storage'
import { createMemoryStorage, createThrowingStorage } from './test-utils'
import type { Task } from './types'

const task = (over: Partial<Task> = {}): Task => ({
  id: 'a',
  title: 'Купить хлеб',
  done: false,
  createdAt: 1,
  ...over,
})

const wrap = (tasks: unknown) => JSON.stringify({ version: 1, tasks })

describe('parseTasks', () => {
  it('пустое значение → пустой список', () => {
    expect(parseTasks(null)).toEqual([])
    expect(parseTasks('')).toEqual([])
  })

  it('битый JSON → пустой список без исключения', () => {
    expect(parseTasks('{not json')).toEqual([])
    expect(parseTasks('undefined')).toEqual([])
  })

  it('чужой формат или другая версия → пустой список', () => {
    expect(parseTasks('[]')).toEqual([])
    expect(parseTasks('42')).toEqual([])
    expect(parseTasks('null')).toEqual([])
    expect(parseTasks(JSON.stringify({ version: 2, tasks: [task()] }))).toEqual([])
    expect(parseTasks(JSON.stringify({ version: 1, tasks: 'nope' }))).toEqual([])
    expect(parseTasks(JSON.stringify([task()]))).toEqual([])
  })

  it('валидные данные читаются как есть', () => {
    const tasks = [task(), task({ id: 'b', done: true, createdAt: 2 })]
    expect(parseTasks(wrap(tasks))).toEqual(tasks)
  })

  it('невалидные элементы отбрасываются поштучно', () => {
    const good = task({ id: 'ok' })
    const raw = wrap([
      good,
      null,
      'строка',
      [],
      { ...good, id: '' },
      { ...good, id: 1 },
      { ...good, id: 'no-title', title: 5 },
      { ...good, id: 'blank', title: '   ' },
      { ...good, id: 'bad-done', done: 'yes' },
      { ...good, id: 'bad-date', createdAt: '2024' },
      { ...good, id: 'nan-date', createdAt: null },
      { id: 'partial' },
    ])
    expect(parseTasks(raw)).toEqual([good])
  })

  it('дубли id отбрасываются, остаётся первый', () => {
    const raw = wrap([task({ title: 'первый' }), task({ title: 'второй' })])
    expect(parseTasks(raw).map((t) => t.title)).toEqual(['первый'])
  })

  it('заголовки нормализуются: trim и обрезка до 200 символов', () => {
    const raw = wrap([task({ title: '  с пробелами  ' }), task({ id: 'long', title: 'я'.repeat(500) })])
    const [a, b] = parseTasks(raw)
    expect(a.title).toBe('с пробелами')
    expect(b.title).toHaveLength(200)
  })

  it('лишние поля не протекают в модель', () => {
    const [parsed] = parseTasks(wrap([{ ...task(), extra: 'x' }]))
    expect(parsed).toEqual(task())
  })
})

describe('normalizeTitle', () => {
  it('обрезает пробелы и длину, не оставляя хвостовой пробел после обрезки', () => {
    expect(normalizeTitle('  a  ')).toBe('a')
    expect(normalizeTitle('   ')).toBe('')
    expect(normalizeTitle(`${'x'.repeat(199)} yyy`)).toBe('x'.repeat(199))
  })
})

describe('loadTasks / saveTasks', () => {
  it('сохраняет и читает обратно в формате { version: 1, tasks }', () => {
    const { storage, data } = createMemoryStorage()
    const tasks = [task(), task({ id: 'b', done: true })]
    expect(saveTasks(storage, tasks)).toBe(true)
    expect(JSON.parse(data.get(STORAGE_KEY)!)).toEqual({ version: 1, tasks })
    expect(loadTasks(storage)).toEqual(tasks)
  })

  it('битый JSON в хранилище → пустой список, следующая запись перезаписывает', () => {
    const { storage, data } = createMemoryStorage({ [STORAGE_KEY]: '{oops' })
    expect(loadTasks(storage)).toEqual([])
    saveTasks(storage, [task()])
    expect(data.get(STORAGE_KEY)).toBe(serializeTasks([task()]))
  })

  it('бросающий localStorage не роняет чтение и запись', () => {
    const storage = createThrowingStorage()
    expect(loadTasks(storage)).toEqual([])
    expect(saveTasks(storage, [task()])).toBe(false)
  })

  it('отсутствующее хранилище (null) → работа без падений', () => {
    expect(loadTasks(null)).toEqual([])
    expect(saveTasks(null, [task()])).toBe(false)
  })
})
