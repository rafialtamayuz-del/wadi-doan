'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { apiSend } from '@/lib/client'
import type { Order } from '@/lib/types'

/** يفتح عبر متصفح الجوال بعد مسح باركود بون المطبخ، ويحدّث حالة الطلب إلى «جاهز» تلقائيًا. */
export function ReadyMarker({ orderId }: { orderId: string }) {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')
  const [order, setOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    apiSend<Order>('/api/actions', 'POST', { action: 'order-ready', orderId })
      .then((o) => {
        if (cancelled) return
        setOrder(o)
        setState('done')
      })
      .catch((e) => {
        if (cancelled) return
        setMessage((e as Error).message)
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-12 animate-spin" aria-hidden="true" />
        <p className="font-medium">جارٍ تحديث حالة الطلب...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-3">
        <XCircle className="size-16 text-destructive" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-bold">تعذّر تحديث الطلب</h1>
        <p className="text-muted-foreground">{message || 'تحقق من رابط الباركود وحاول مجددًا.'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <CheckCircle2 className="size-16 text-emerald-600" aria-hidden="true" />
      <h1 className="font-heading text-2xl font-bold">تم تحديث الطلب إلى «جاهز»</h1>
      {order && (
        <p className="text-lg">
          طلب رقم <span className="font-bold">#{order.number}</span> أصبح جاهزًا للتسليم.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        ظهر التحديث فورًا في شاشة الإدارة وشاشة المطبخ.
      </p>
      <Link href="/kitchen" className="mt-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
        العودة لشاشة المطبخ
      </Link>
    </div>
  )
}
