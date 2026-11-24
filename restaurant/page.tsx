import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { RestaurantApp } from '@/components/restaurant/restaurant-app'

export const metadata: Metadata = {
  title: 'المنيو والطلب أونلاين',
  description: 'اطلب مندي وحنيذ ومضغوط، واحجز الذبائح والولائم ووجبات الإعاشة وإفطار صائم من مطاعم ومطابخ وادي دوعن.',
}

export default function RestaurantPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="p-8 text-center text-muted-foreground">جارٍ التحميل...</p>}>
        <RestaurantApp />
      </Suspense>
    </>
  )
}
