import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Evently',
  description: 'Evently is a platform for event management.',
  icons: {
    icon: '/assets/images/logo.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Header />
        <body className={poppins.className}>{children}</body>
      <Footer />
    </html>
  )
}
