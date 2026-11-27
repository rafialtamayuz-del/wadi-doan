import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { ServiceRating } from '@/components/restaurant/service-rating'

export const metadata: Metadata = { title: 'تقييم الطلب', robots: { index: false } }

/** صفحة تقييم سريعة تُفتح تلقائيًا بعد تسليم الطلب (رابط /rate/[orderId]). */
export default function RatePage({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="p-8 text-center text-muted-foreground">جارٍ التحميل...</p>}>
        <RateInner params={params} />
      </Suspense>
    </>
  )
}

async function RateInner({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  return <ServiceRating orderId={orderId} />
}
