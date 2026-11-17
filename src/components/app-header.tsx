import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Logo />
        <div className="min-w-0">
          <h1 className="ty-page-title">Галка</h1>
          <p className="ty-subtitle">Отмечай и забывай</p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  )
}
