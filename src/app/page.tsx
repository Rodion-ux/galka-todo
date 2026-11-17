import { AppHeader } from '@/components/app-header'
import { BackgroundDecor } from '@/components/background-decor'
import { TodoApp } from '@/components/todo-app'

export default function Home() {
  return (
    <>
      <BackgroundDecor />
      <main className="relative z-10 mx-auto flex w-full max-w-[560px] flex-col px-4 pt-5 pb-28 sm:box-content sm:px-6 sm:pt-[72px]">
        <div className="flex flex-col max-sm:bg-transparent sm:g-panel sm:p-7">
          <AppHeader />
          <TodoApp />
        </div>
        <p className="ty-micro mt-6 text-center">Задачи хранятся только в этом браузере.</p>
      </main>
    </>
  )
}
