'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Input, Notice, Select } from '@/components/ui/fields'
import { apiSend, useOrders } from '@/lib/client'
import { formatDateTime, sar } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_TYPES, PAYMENT_METHODS, type Order, type OrderStatus } from '@/lib/types'

const PAY_LABEL = { paid: 'مدفوع', pending: 'عند الاستلام', review: 'مراجعة التحويل' }
const PAY_TONE = { paid: 'success', pending: 'neutral', review: 'warning' } as const
const STATUS_TONE = { new: 'danger', preparing: 'accent', ready: 'primary', completed: 'success', cancelled: 'neutral' } as const

export function OrdersPanel() {
  const { data: orders, mutate } = useOrders(5000)
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [verifying, setVerifying] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const list = useMemo(
    () =>
      (orders ?? []).filter(
        (o) =>
          (status === 'all' || o.status === status) &&
          (!q.trim() || String(o.number).includes(q.trim()) || o.customerName.includes(q.trim()) || o.phone.includes(q.trim())),
      ),
    [orders, status, q],
  )

  async function update(
    id: string,
    patch: { status?: OrderStatus; paymentStatus?: Order['payment']['status']; pickupCode?: string },
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

  /** تغيير الحالة، مع طلب كود الاستلام قبل «تم التسليم» للطلبات المدفوعة إلكترونيًا. */
  function changeStatus(order: Order, next: OrderStatus) {
    if (next === 'completed' && order.requiresPickupCode) {
      setCode('')
      setVerifying(order.id)
      return
    }
    void update(order.id, { status: next })
  }

  async function confirmDelivery(order: Order) {
    if (await update(order.id, { status: 'completed', pickupCode: code })) {
      setVerifying(null)
      setCode('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Notice>{error}</Notice>}
      <div className="flex flex-wrap gap-3">
        <Input type="search" aria-label="بحث في الطلبات" placeholder="رقم الطلب أو الاسم أو الجوال" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select aria-label="تصفية حسب الحالة" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')} className="w-44">
          <option value="all">كل الحالات</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-right">
              <th className="p-3 font-semibold">#</th>
              <th className="p-3 font-semibold">العميل</th>
              <th className="p-3 font-semibold">النوع</th>
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
                  <p className="font-medium">{o.customerName}</p>
                  <p dir="ltr" className="text-right text-xs text-muted-foreground">
                    {o.phone}
                  </p>
                </td>
                <td className="p-3">
                  {ORDER_TYPES.find((t) => t.id === o.type)?.label}
                  {o.isBooking && <Badge tone="accent" className="mr-1">حجز</Badge>}
                  {o.scheduledAt && <p className="text-xs text-muted-foreground">موعد: {formatDateTime(o.scheduledAt)}</p>}
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
                    {o.requiresPickupCode && (
                      <Badge tone="primary">
                        <ShieldCheck className="size-3" aria-hidden="true" />
                        كود استلام
                      </Badge>
                    )}
                    <Select aria-label={`تغيير حالة الطلب ${o.number}`} value={o.status} onChange={(e) => changeStatus(o, e.target.value as OrderStatus)} className="h-8 text-xs">
                      {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                    {verifying === o.id && (
                      <div className="flex flex-col gap-1.5 rounded-lg border border-primary/40 bg-primary/5 p-2">
                        <span className="text-xs font-semibold text-primary">كود الاستلام (5 أرقام)</span>
                        <div className="flex gap-1.5">
                          <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                            inputMode="numeric"
                            dir="ltr"
                            placeholder="- - - - -"
                            aria-label={`كود استلام الطلب ${o.number}`}
                            className="h-8 w-24 text-center font-mono tracking-widest"
                          />
                          <Button size="sm" disabled={code.length !== 5} onClick={() => confirmDelivery(o)}>
                            تأكيد التسليم
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setVerifying(null)}>
                            إلغاء
                          </Button>
                        </div>
                        {error && <span className="text-xs text-destructive">{error}</span>}
                      </div>
                    )}
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
