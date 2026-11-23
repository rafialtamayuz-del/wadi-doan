'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice } from '@/components/ui/fields'
import { fetcher } from '@/lib/client'
import { formatDateTime, sar } from '@/lib/format'
import { ORDER_STATUS_LABEL, type Complaint, type Order, type OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STEPS: OrderStatus[] = ['new', 'preparing', 'ready', 'completed']

export function TrackPanel() {
  const [query, setQuery] = useState<{ number: string; phone: string } | null>(null)
  const key = query ? `/api/orders/track?number=${encodeURIComponent(query.number)}&phone=${encodeURIComponent(query.phone)}` : null
  const { data, error, isLoading } = useSWR<{ order: Order | null; complaints: Complaint[] }>(key, fetcher, {
    refreshInterval: 5000,
  })

  const order = data?.order
  const stepIndex = order ? STEPS.indexOf(order.status) : -1

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card className="p-5">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          action={(form) => setQuery({ number: String(form.get('number')), phone: String(form.get('phone')) })}
        >
          <Field label="رقم الطلب">
            <Input name="number" required inputMode="numeric" placeholder="1001" />
          </Field>
          <Field label="رقم الجوال">
            <Input name="phone" required type="tel" dir="ltr" placeholder="05xxxxxxxx" />
          </Field>
          <Button type="submit" size="lg" className="h-10">
            تتبع
          </Button>
        </form>
      </Card>

      {isLoading && <p className="text-center text-muted-foreground">جارٍ البحث...</p>}
      {error && <Notice>تعذّر العثور على البيانات، تحقق من رقم الجوال.</Notice>}
      {data && !order && <Notice>لا يوجد طلب بهذا الرقم مرتبط برقم الجوال المدخل.</Notice>}

      {order && (
        <Card className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-bold">طلب رقم #{order.number}</h2>
            <Badge tone={order.status === 'cancelled' ? 'danger' : 'primary'}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          </div>
          {order.status !== 'cancelled' && (
            <ol className="grid grid-cols-4 gap-2" aria-label="مراحل الطلب">
              {STEPS.map((s, i) => (
                <li key={s} className="flex flex-col items-center gap-2 text-center text-xs">
                  <span
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full border-2 font-bold',
                      i <= stepIndex ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {i < stepIndex ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={i <= stepIndex ? 'font-semibold' : 'text-muted-foreground'}>{ORDER_STATUS_LABEL[s]}</span>
                </li>
              ))}
            </ol>
          )}
          {order.scheduledAt && <p className="text-sm">الموعد المحدد: {formatDateTime(order.scheduledAt)}</p>}
          <ul className="divide-y text-sm">
            {order.lines.map((l) => (
              <li key={`${l.itemId}-${l.options ?? ''}`} className="flex justify-between py-2">
                <span>
                  {l.name} × {l.qty}
                  {l.options && <span className="block text-xs text-muted-foreground">{l.options}</span>}
                </span>
                <span>{sar(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <span className="font-bold">الإجمالي: {sar(order.total)}</span>
            <Link href={`/invoice/${order.id}`} className="text-sm font-semibold text-primary hover:underline">
              عرض الفاتورة
            </Link>
          </div>
        </Card>
      )}

      {data && data.complaints.length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-heading text-lg font-bold">شكاواك وملاحظاتك</h2>
          {data.complaints.map((c) => (
            <div key={c.id} className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                <Badge tone={c.status === 'resolved' ? 'success' : 'warning'}>{c.status === 'resolved' ? 'تمت المعالجة' : 'قيد المراجعة'}</Badge>
              </div>
              <p>{c.message}</p>
              {c.reply && (
                <p className="rounded-md border-r-4 border-primary bg-card p-2">
                  <span className="font-semibold">رد الإدارة: </span>
                  {c.reply}
                </p>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
