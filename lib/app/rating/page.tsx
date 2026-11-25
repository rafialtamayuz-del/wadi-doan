import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { ServiceRating } from '@/components/restaurant/service-rating'

export const metadata: Metadata = { title: 'تقييم الخدمة', robots: { index: false } }

export default function RatingPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="p-8 text-center text-muted-foreground">جارٍ التحميل...</p>}>
        <ServiceRating />
      </Suspense>
    </>
  )
}
