import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { KitchenBoard } from '@/components/kitchen/kitchen-board'

export const metadata: Metadata = { title: 'شاشة المطبخ', robots: { index: false } }

export default function KitchenPage() {
  return (
    <>
      <SiteHeader />
      <KitchenBoard />
    </>
  )
}
