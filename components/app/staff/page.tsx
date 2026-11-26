import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { StaffApp } from '@/components/staff/staff-app'

export const metadata: Metadata = { title: 'شاشة موظفي المطعم', robots: { index: false } }

export default function StaffPage() {
  return (
    <>
      <SiteHeader />
      <StaffApp />
    </>
  )
}
