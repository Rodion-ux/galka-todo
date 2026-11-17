export type Task = {
  id: string
  /** trim, 1..TITLE_MAX_LENGTH символов */
  title: string
  done: boolean
  /** ms epoch */
  createdAt: number
}

export type Filter = 'all' | 'active' | 'done'

export const TITLE_MAX_LENGTH = 200

/** Формат записи в localStorage. */
export type StoredTasks = {
  version: 1
  tasks: Task[]
}
