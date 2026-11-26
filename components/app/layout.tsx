import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from 'next/font/google'
import { ThemeApplier } from '@/components/theme-applier'
import './globals.css'

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
})

const kufi = Reem_Kufi({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-kufi',
})

export const metadata: Metadata = {
  title: {
    default: 'مطاعم ومطابخ وادي دوعن | مندي وحنيذ وذبائح وولائم في جدة',
    template: '%s | مطاعم ومطابخ وادي دوعن',
  },
  description:
    'مطاعم ومطابخ وادي دوعن في حي النسيم بجدة: مطعم يومي للمندي والحنيذ، مطبخ ذبائح، تجهيز ولائم ومناسبات، وجبات إعاشة للشركات، وإفطار صائم. اطلب أونلاين أو احجز ذبيحتك الآن.',
  keywords: [
    'مطاعم وادي دوعن',
    'مطابخ وادي دوعن',
    'مطعم حضرمي جدة',
    'مندي حي النسيم',
    'مطبخ ذبائح جدة',
    'ذبائح حي النسيم',
    'ولائم ومناسبات جدة',
    'تجهيز ولائم',
    'وجبات إعاشة جدة',
    'إعاشة شركات',
    'إفطار صائم جدة',
    'حنيذ',
    'مضغوط',
    'مطبخ جدة',
  ],
  generator: 'v0.app',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: 'مطاعم ومطابخ وادي دوعن',
    title: 'مطاعم ومطابخ وادي دوعن',
    description: 'مندي وحنيذ وذبائح وولائم وإعاشة وإفطار صائم في جدة.',
    images: ['/images/hero.png'],
  },
  icons: { icon: '/images/logo.png', apple: '/images/logo.png' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#8a3b1f',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${kufi.variable} bg-background`}>
      <body className="font-sans antialiased">
        <ThemeApplier />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
