import { AppHeader } from '@/components/app-header'
import { TodoApp } from '@/components/todo-app'

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[648px] flex-col px-4 pt-1 pb-24 sm:px-6 sm:pt-[60px]">
      <AppHeader />
      <TodoApp />
    </main>
  )
}
