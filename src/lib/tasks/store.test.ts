import { describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, loadTasks, serializeTasks } from './storage'
import { createId, createTaskStore, type TaskStoreOptions } from './store'
import { createMemoryStorage, createThrowingStorage } from './test-utils'
import type { Task } from './types'

function setup(options: TaskStoreOptions & { initial?: Record<string, string> } = {}) {
  const { initial, ...rest } = options
  const mem = createMemoryStorage(initial)
  let seq = 0
  let clock = 1000
  const target = new EventTarget()
  const store = createTaskStore({
    getStorage: () => mem.storage,
    getEventTarget: () => target,
    createId: () => `id-${++seq}`,
    now: () => clock++,
    ...rest,
  })
  return { store, mem, target }
}

const stored = (tasks: Task[]) => ({ [STORAGE_KEY]: serializeTasks(tasks) })

describe('гидрация', () => {
  it('до загрузки: пустой список и hydrated=false; серверный снапшот стабилен', () => {
    const { store } = setup({ initial: stored([{ id: 'x', title: 'a', done: false, createdAt: 1 }]) })
    expect(store.getSnapshot()).toEqual({ tasks: [], hydrated: false })
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot())
    expect(store.getSnapshot()).toBe(store.getServerSnapshot())
  })

  it('первая подписка лениво читает хранилище и оповещает', () => {
    const existing: Task = { id: 'x', title: 'a', done: false, createdAt: 1 }
    const { store } = setup({ initial: stored([existing]) })
    const listener = vi.fn()
    store.subscribe(listener)
    expect(store.getSnapshot()).toEqual({ tasks: [existing], hydrated: true })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('снапшот не меняется без изменений (стабильная ссылка)', () => {
    const { store } = setup()
    store.hydrate()
    const a = store.getSnapshot()
    store.hydrate()
    expect(store.getSnapshot()).toBe(a)
  })
})

describe('add', () => {
  it('добавляет задачу сверху и сохраняет', () => {
    const { store, mem } = setup()
    store.add('Первая')
    store.add('Вторая')
    const { tasks } = store.getSnapshot()
    expect(tasks.map((t) => t.title)).toEqual(['Вторая', 'Первая'])
    expect(tasks[0]).toEqual({ id: 'id-2', title: 'Вторая', done: false, createdAt: 1001 })
    expect(loadTasks(mem.storage)).toEqual(tasks)
  })

  it('обрезает пробелы', () => {
    const { store } = setup()
    expect(store.add('   Купить молоко  ')?.title).toBe('Купить молоко')
  })

  it('пустой и пробельный ввод не добавляется и не пишет в хранилище', () => {
    const { store, mem } = setup()
    expect(store.add('')).toBeNull()
    expect(store.add('   \n\t ')).toBeNull()
    expect(store.getSnapshot().tasks).toEqual([])
    expect(mem.data.has(STORAGE_KEY)).toBe(false)
  })

  it('обрезает заголовок длиннее 200 символов', () => {
    const { store } = setup()
    expect(store.add('ж'.repeat(250))?.title).toHaveLength(200)
    expect(store.add('ж'.repeat(200))?.title).toHaveLength(200)
  })

  it('не затирает сохранённые задачи, если экшен вызван до подписки', () => {
    const existing: Task = { id: 'x', title: 'старая', done: false, createdAt: 1 }
    const { store, mem } = setup({ initial: stored([existing]) })
    store.add('новая')
    expect(loadTasks(mem.storage).map((t) => t.title)).toEqual(['новая', 'старая'])
  })

  it('быстрый двойной ввод даёт две задачи с разными id', () => {
    const { store } = setup()
    store.add('раз')
    store.add('раз')
    const ids = store.getSnapshot().tasks.map((t) => t.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('toggle / remove / clearDone', () => {
  it('toggle переключает done туда и обратно', () => {
    const { store, mem } = setup()
    const t = store.add('задача')!
    store.toggle(t.id)
    expect(store.getSnapshot().tasks[0].done).toBe(true)
    expect(loadTasks(mem.storage)[0].done).toBe(true)
    store.toggle(t.id)
    expect(store.getSnapshot().tasks[0].done).toBe(false)
  })

  it('remove удаляет только указанную задачу', () => {
    const { store, mem } = setup()
    const a = store.add('a')!
    store.add('b')
    store.remove(a.id)
    expect(store.getSnapshot().tasks.map((t) => t.title)).toEqual(['b'])
    expect(loadTasks(mem.storage).map((t) => t.title)).toEqual(['b'])
  })

  it('clearDone удаляет только выполненные', () => {
    const { store } = setup()
    const a = store.add('a')!
    store.add('b')
    const c = store.add('c')!
    store.toggle(a.id)
    store.toggle(c.id)
    store.clearDone()
    expect(store.getSnapshot().tasks.map((t) => t.title)).toEqual(['b'])
  })

  it('неизвестный id и clearDone без выполненных — no-op без оповещения', () => {
    const { store } = setup()
    store.add('a')
    const before = store.getSnapshot()
    const listener = vi.fn()
    store.subscribe(listener)
    store.toggle('nope')
    store.remove('nope')
    store.clearDone()
    expect(store.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('иммутабельность', () => {
  it('каждый экшен создаёт новый массив и не мутирует старые задачи', () => {
    const { store } = setup()
    const t = store.add('a')!
    const s1 = store.getSnapshot()
    const tasks1 = s1.tasks
    const task1 = tasks1[0]

    store.toggle(t.id)
    const s2 = store.getSnapshot()
    expect(s2).not.toBe(s1)
    expect(s2.tasks).not.toBe(tasks1)
    expect(s2.tasks[0]).not.toBe(task1)
    expect(task1.done).toBe(false)
    expect(tasks1).toHaveLength(1)

    store.add('b')
    expect(s2.tasks).toHaveLength(1)

    store.remove(t.id)
    store.clearDone()
    expect(s2.tasks[0].done).toBe(true)
  })

  it('незатронутые задачи сохраняют ссылку', () => {
    const { store } = setup()
    const a = store.add('a')!
    store.add('b')
    const bRef = store.getSnapshot().tasks[0]
    store.toggle(a.id)
    expect(store.getSnapshot().tasks[0]).toBe(bRef)
  })
})

describe('недоступное хранилище', () => {
  it('бросающий localStorage: работа в памяти без падений', () => {
    const { store } = setup({ getStorage: () => createThrowingStorage() })
    expect(() => store.hydrate()).not.toThrow()
    const t = store.add('в памяти')!
    store.toggle(t.id)
    expect(store.getSnapshot()).toMatchObject({ hydrated: true, tasks: [{ title: 'в памяти', done: true }] })
    store.remove(t.id)
    expect(store.getSnapshot().tasks).toEqual([])
  })

  it('нет хранилища вовсе (null)', () => {
    const { store } = setup({ getStorage: () => null })
    store.add('a')
    expect(store.getSnapshot().tasks).toHaveLength(1)
  })

  it('битый JSON: пустой список, следующая запись перезаписывает', () => {
    const { store, mem } = setup({ initial: { [STORAGE_KEY]: '{broken' } })
    store.hydrate()
    expect(store.getSnapshot()).toEqual({ tasks: [], hydrated: true })
    store.add('новая')
    expect(loadTasks(mem.storage).map((t) => t.title)).toEqual(['новая'])
  })
})

describe('синхронизация вкладок', () => {
  const storageEvent = (key: string | null) => Object.assign(new Event('storage'), { key })

  it('событие storage по нашему ключу перечитывает данные и оповещает', () => {
    const { store, mem, target } = setup()
    const listener = vi.fn()
    store.subscribe(listener)
    listener.mockClear()

    const fromOtherTab: Task = { id: 'remote', title: 'из другой вкладки', done: false, createdAt: 5 }
    mem.data.set(STORAGE_KEY, serializeTasks([fromOtherTab]))
    target.dispatchEvent(storageEvent(STORAGE_KEY))

    expect(store.getSnapshot().tasks).toEqual([fromOtherTab])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('clear() в другой вкладке (key=null) очищает список', () => {
    const { store, mem, target } = setup()
    store.subscribe(() => {})
    store.add('a')
    mem.data.clear()
    target.dispatchEvent(storageEvent(null))
    expect(store.getSnapshot().tasks).toEqual([])
  })

  it('чужие ключи игнорируются', () => {
    const { store, target } = setup()
    const listener = vi.fn()
    store.subscribe(listener)
    listener.mockClear()
    target.dispatchEvent(storageEvent('galka:theme'))
    expect(listener).not.toHaveBeenCalled()
  })

  it('после отписки последнего слушателя событие storage не обрабатывается', () => {
    const { store, mem, target } = setup()
    const unsubscribe = store.subscribe(() => {})
    unsubscribe()
    const before = store.getSnapshot()
    mem.data.set(STORAGE_KEY, serializeTasks([{ id: 'r', title: 'r', done: false, createdAt: 1 }]))
    target.dispatchEvent(storageEvent(STORAGE_KEY))
    expect(store.getSnapshot()).toBe(before)
  })
})

describe('createId', () => {
  it('возвращает уникальные строки', () => {
    const ids = new Set(Array.from({ length: 100 }, createId))
    expect(ids.size).toBe(100)
  })

  it('работает без crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {})
    try {
      const a = createId()
      const b = createId()
      expect(a).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
      expect(a).not.toBe(b)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
