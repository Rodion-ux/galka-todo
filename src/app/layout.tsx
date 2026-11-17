import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Unbounded } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { ThemeInitScript } from '@/components/theme-init-script'
import './globals.css'

// Дисплейный шрифт: вордмарк, большой счётчик, заголовки пустых состояний.
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  variable: '--font-unbounded',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Галка',
  description: 'Простой список задач: добавляй, отмечай, удаляй. Всё хранится в браузере.',
  icons: { icon: '/logo.svg' },
}

export const viewport: Viewport = {
  // env(safe-area-inset-bottom) для тоста над home-indicator
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${GeistSans.variable} ${GeistMono.variable} ${unbounded.variable} dark h-full`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="relative flex min-h-full flex-col">{children}</body>
    </html>
  )
}
