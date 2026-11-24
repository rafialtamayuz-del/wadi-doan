'use client'

import { useEffect } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiSend } from '@/lib/client'

/**
 * زر الطباعة. عند تفعيل auto يُطبع تلقائيًا، وإذا مُرّر prepareOrderId
 * يُنقل الطلب الإلكتروني إلى «قيد التجهيز» تلقائيًا قبل الطباعة.
 */
export function PrintButton({
  label = 'طباعة',
  auto = false,
  prepareOrderId,
}: {
  label?: string
  auto?: boolean
  prepareOrderId?: string
}) {
  useEffect(() => {
    if (!auto) return
    let cancelled = false
    const timer = setTimeout(async () => {
      if (prepareOrderId) {
        try {
          await apiSend(`/api/orders/${prepareOrderId}`, 'PATCH', { status: 'preparing' })
        } catch {
          // نتجاهل الخطأ (مثل عدم تسجيل الدخول) ونكمل الطباعة
        }
      }
      if (!cancelled) window.print()
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [auto, prepareOrderId])

  return (
    <Button size="lg" className="print:hidden" onClick={() => window.print()}>
      <Printer aria-hidden="true" />
      {label}
    </Button>
  )
}
