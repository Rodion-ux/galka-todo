import { AppHeader } from '@/components/app-header'
import { TodoApp } from '@/components/todo-app'
import { KRIVO_SURFACE } from '@/lib/krivo-ui'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-8 sm:py-16">
      <div className={cn(KRIVO_SURFACE, 'flex flex-col gap-6 p-4 sm:p-6')}>
        <AppHeader />
        <TodoApp />
      </div>
      <p className="ty-meta text-center">Задачи хранятся только в этом браузере.</p>
    </main>
  )
}
