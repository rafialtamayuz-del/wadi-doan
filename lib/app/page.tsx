import { connection } from 'next/server'
import { getSettings } from '@/lib/data'
import { SiteHeader } from '@/components/site-header'
import { WhatsappFab } from '@/components/whatsapp-fab'
import { HomeHero } from '@/components/home/home-hero'
import { Specialties } from '@/components/home/specialties'
import { ContactSection } from '@/components/home/contact-section'
import { StaffLoginBar } from '@/components/home/staff-login-bar'
import { SiteFooter } from '@/components/home/site-footer'

export default async function HomePage() {
  await connection()
  const settings = await getSettings()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: settings.name,
    description: settings.about,
    servesCuisine: ['حضرمي', 'يمني', 'عربي'],
    telephone: settings.phone,
    email: settings.email,
    image: '/images/hero.png',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.locations[0]?.address,
      addressLocality: settings.city,
      addressRegion: settings.district,
      addressCountry: 'SA',
    },
    geo: settings.locations[0]
      ? { '@type': 'GeoCoordinates', latitude: settings.locations[0].lat, longitude: settings.locations[0].lng }
      : undefined,
    hasMenu: '/restaurant',
    acceptsReservations: true,
  }

  return (
    <>
      <SiteHeader />
      <main>
        <HomeHero settings={settings} />
        <Specialties />
        <ContactSection settings={settings} />
        <StaffLoginBar />
      </main>
      <SiteFooter settings={settings} />
      <WhatsappFab number={settings.whatsapp} name={settings.name} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
