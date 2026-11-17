import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppHeader() {
  return (
    <header className="flex h-10 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Logo />
        <h1 className="ty-wordmark text-g-text">Галка</h1>
      </div>
      <ThemeToggle />
    </header>
  )
}
