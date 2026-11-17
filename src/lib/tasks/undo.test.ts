import { describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, loadTasks, serializeTasks } from './storage'
import { createTaskStore } from './store'
import { createMemoryStorage } from './test-utils'
import type { Task } from './types'
import { createUndoStore } from './undo'

const task = (id: string, done = false): Task => ({ id, title: id, done, createdAt: 1 })

function setup(initial: Task[]) {
  const mem = createMemoryStorage({ [STORAGE_KEY]: serializeTasks(initial) })
  let seq = 0
  const store = createTaskStore({
    getStorage: () => mem.storage,
    getEventTarget: () => null,
    createId: () => `new-${++seq}`,
    now: () => 2,
  })
  const undo = createUndoStore(store.restore)
  const ids = () => store.getSnapshot().tasks.map((t) => t.id)
  return { store, undo, mem, ids }
}

describe('remove / clearDone возвращают удалённое с позициями', () => {
  it('remove: задача, индекс и сосед сверху', () => {
    const { store } = setup([task('a'), task('b'), task('c')])
    expect(store.remove('b')).toEqual([{ task: task('b'), index: 1, prevId: 'a' }])
    expect(store.remove('a')).toEqual([{ task: task('a'), index: 0, prevId: null }])
  })

  it('неизвестный id и clearDone без выполненных → []', () => {
    const { store } = setup([task('a')])
    expect(store.remove('nope')).toEqual([])
    expect(store.clearDone()).toEqual([])
  })

  it('clearDone возвращает все выполненные по порядку', () => {
    const { store } = setup([task('a', true), task('b'), task('c', true)])
    expect(store.clearDone().map((e) => [e.task.id, e.index, e.prevId])).toEqual([
      ['a', 0, null],
      ['c', 2, 'b'],
    ])
  })
})

describe('restore', () => {
  it('возвращает задачу на прежнее место с прежним статусом и сохраняет', () => {
    const { store, mem, ids } = setup([task('a'), task('b', true), task('c')])
    const removed = store.remove('b')
    store.restore(removed)
    expect(ids()).toEqual(['a', 'b', 'c'])
    expect(store.getSnapshot().tasks[1].done).toBe(true)
    expect(loadTasks(mem.storage).map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('после clearDone восстанавливает несколько задач в исходном порядке', () => {
    const { store, ids } = setup([task('a', true), task('b'), task('c', true), task('d', true), task('e')])
    store.restore(store.clearDone())
    expect(ids()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('если сверху добавили новую задачу, восстановленная встаёт за прежним соседом', () => {
    const { store, ids } = setup([task('a'), task('b'), task('c')])
    const removed = store.remove('c')
    store.add('свежая')
    store.restore(removed)
    expect(ids()).toEqual(['new-1', 'a', 'b', 'c'])
  })

  it('соседа тоже удалили — падает на прежний индекс', () => {
    const { store, ids } = setup([task('a'), task('b'), task('c')])
    const removed = store.remove('b')
    store.remove('a')
    store.restore(removed)
    expect(ids()).toEqual(['c', 'b'])
  })

  it('уже существующие id пропускаются; пустой restore — no-op без оповещения', () => {
    const { store } = setup([task('a'), task('b')])
    const removed = store.remove('a')
    store.restore(removed)
    const before = store.getSnapshot()
    const listener = vi.fn()
    store.subscribe(listener)
    store.restore(removed)
    store.restore([])
    expect(store.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('undo-стор', () => {
  it('push → undo восстанавливает и очищает тост', () => {
    const { store, undo, ids } = setup([task('a'), task('b')])
    undo.push('Задача удалена', store.remove('a'))
    expect(undo.getSnapshot()).toMatchObject({ key: 1, message: 'Задача удалена' })
    expect(undo.undo().map((e) => e.task.id)).toEqual(['a'])
    expect(undo.getSnapshot()).toBeNull()
    expect(ids()).toEqual(['a', 'b'])
  })

  it('пустое удаление тост не показывает', () => {
    const { undo } = setup([])
    undo.push('Удалено: 0', [])
    expect(undo.getSnapshot()).toBeNull()
  })

  it('новое действие вытесняет старое: undo только для последнего', () => {
    const { store, undo, ids } = setup([task('a'), task('b'), task('c')])
    undo.push('Задача удалена', store.remove('a'))
    const firstKey = undo.getSnapshot()!.key
    undo.push('Задача удалена', store.remove('b'))
    expect(undo.undo(firstKey)).toEqual([])
    expect(ids()).toEqual(['c'])
    undo.undo()
    expect(ids()).toEqual(['b', 'c'])
  })

  it('dismiss по ключу не трогает новый тост; оповещает подписчиков', () => {
    const { store, undo } = setup([task('a'), task('b')])
    const listener = vi.fn()
    undo.subscribe(listener)
    undo.push('Задача удалена', store.remove('a'))
    const old = undo.getSnapshot()!.key
    undo.push('Задача удалена', store.remove('b'))
    undo.dismiss(old)
    expect(undo.getSnapshot()).not.toBeNull()
    undo.dismiss()
    expect(undo.getSnapshot()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(3)
    expect(undo.getServerSnapshot()).toBeNull()
  })
})
