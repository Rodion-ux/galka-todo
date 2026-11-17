import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Golos_Text, Source_Serif_4 } from 'next/font/google'
import { PRODUCT_NAME, THEME_COLOR } from '@/lib/brand'
import './globals.css'

// Единственный шрифт интерфейса (BRIEF-v2 §5.3): текстовый гротеск с родной кириллицей.
const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-golos',
  display: 'swap',
})

// Только вордмарк «pensum»: один вес, только латиница.
const brandSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: '600',
  variable: '--font-brand-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: 'Список дел на день: записать, отметить, посчитать.',
  icons: { icon: '/logo.svg' },
}

export const viewport: Viewport = {
  // env(safe-area-inset-bottom) для тоста над home-indicator
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: THEME_COLOR,
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru" className={`${golos.variable} ${brandSerif.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
