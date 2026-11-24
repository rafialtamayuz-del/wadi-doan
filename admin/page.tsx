import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { AdminApp } from '@/components/admin/admin-app'

export const metadata: Metadata = { title: 'لوحة تحكم صاحب المشروع', robots: { index: false } }

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <AdminApp />
    </>
  )
}
