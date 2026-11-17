import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { ThemeInitScript } from '@/components/theme-init-script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Галка',
  description: 'Простой список задач: добавляй, отмечай, удаляй. Всё хранится в браузере.',
  icons: { icon: '/logo.svg' },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
