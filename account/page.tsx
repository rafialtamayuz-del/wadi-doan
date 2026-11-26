import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { AccountForm } from '@/components/account/account-form'

export const metadata: Metadata = { title: 'حسابي', robots: { index: false } }

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <AccountForm />
    </>
  )
}
