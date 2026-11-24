'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Badge, Card, Input, Notice, Select } from '@/components/ui/fields'
import { apiSend, useOrders } from '@/lib/client'
import { formatDateTime, sar } from '@/lib/format'
import {
  ACTIVE_ORDER_STATUSES,
  ARCHIVED_ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_TYPES,
  PAYMENT_METHODS,
  type Order,
  type OrderStatus,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const PAY_LABEL = { paid: 'مدفوع', pending: 'عند الاستلام', review: 'مراجعة التحويل' }
const PAY_TONE = { paid: 'success', pending: 'neutral', review: 'warning' } as const
const STATUS_TONE = { new: 'danger', preparing: 'accent', ready: 'primary', completed: 'success', settled: 'success', cancelled: 'neutral' } as const

type View = 'active' | 'archived'
const VIEW_TABS: { id: View; label: string }[] = [
  { id: 'active', label: 'الطلبات النشطة' },
  { id: 'archived', label: 'الطلبات المنتهية / المسلمة' },
]

export function OrdersPanel() {
  const { data: orders, mutate } = useOrders(5000)
  const [view, setView] = useState<View>('active')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  const statuses = view === 'active' ? ACTIVE_ORDER_STATUSES : ARCHIVED_ORDER_STATUSES
  const list = useMemo(
    () =>
      (orders ?? []).filter(
        (o) =>
          statuses.includes(o.status) &&
          (!q.trim() || String(o.number).includes(q.trim()) || o.customerName.includes(q.trim()) || o.phone.includes(q.trim())),
      ),
    [orders, statuses, q],
  )

  const countOf = (target: View) =>
    (orders ?? []).filter((o) => (target === 'active' ? ACTIVE_ORDER_STATUSES : ARCHIVED_ORDER_STATUSES).includes(o.status)).length

  async function update(
    id: string,
    patch: { status?: OrderStatus; paymentStatus?: Order['payment']['status'] },
  ): Promise<boolean> {
    setError('')
    try {
      await apiSend<Order>(`/api/orders/${id}`, 'PATCH', patch)
      await mutate()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Notice>{error}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border p-1">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              aria-current={view === tab.id ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                view === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              {tab.label} ({countOf(tab.id)})
            </button>
          ))}
        </div>
        <Input type="search" aria-label="بحث في الطلبات" placeholder="رقم الطلب أو الاسم أو الجوال" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-right">
              <th className="p-3 font-semibold">#</th>
              <th className="p-3 font-semibold">العميل</th>
              <th className="p-3 font-semibold">النوع</th>
              <th className="p-3 font-semibold">كود الاستلام</th>
              <th className="p-3 font-semibold">التاريخ</th>
              <th className="p-3 font-semibold">الإجمالي</th>
              <th className="p-3 font-semibold">الدفع</th>
              <th className="p-3 font-semibold">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b align-top last:border-0">
                <td className="p-3">
                  <Link href={`/invoice/${o.id}`} className="font-bold text-primary hover:underline">
                    {o.number}
                  </Link>
                  {o.priority === 'urgent' && <Badge tone="danger" className="mr-1">عاجل</Badge>}
                </td>
                <td className="p-3">
                  <p className="font-medium">{o.customerName || 'عميل محلي'}</p>
                  {o.phone && (
                    <p dir="ltr" className="text-right text-xs text-muted-foreground">
                      {o.phone}
                    </p>
                  )}
                </td>
                <td className="p-3">
                  {ORDER_TYPES.find((t) => t.id === o.type)?.label}
                  {o.isBooking && <Badge tone="accent" className="mr-1">حجز</Badge>}
                  {o.scheduledAt && <p className="text-xs text-muted-foreground">موعد: {formatDateTime(o.scheduledAt)}</p>}
                </td>
                <td className="p-3">
                  {o.pickupCode ? (
                    <Badge tone="primary" className="font-mono text-sm tracking-widest">
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      <span dir="ltr">{o.pickupCode}</span>
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 text-xs">{formatDateTime(o.createdAt)}</td>
                <td className="p-3 font-semibold">{sar(o.total)}</td>
                <td className="p-3">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-xs">{PAYMENT_METHODS.find((p) => p.id === o.payment.method)?.label}</span>
                    <Badge tone={PAY_TONE[o.payment.status]}>{PAY_LABEL[o.payment.status]}</Badge>
                    {o.payment.receipt && (
                      <a href={o.payment.receipt} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                        عرض الإيصال
                      </a>
                    )}
                    {o.payment.status !== 'paid' && (
                      <button type="button" onClick={() => update(o.id, { paymentStatus: 'paid' })} className="text-xs font-semibold text-emerald-700 hover:underline">
                        تأكيد الدفع
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-col items-start gap-1">
                    <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    <Select aria-label={`تغيير حالة الطلب ${o.number}`} value={o.status} onChange={(e) => update(o.id, { status: e.target.value as OrderStatus })} className="h-8 text-xs">
                      {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-8 text-center text-muted-foreground">لا توجد طلبات</p>}
      </Card>
    </div>
  )
}
