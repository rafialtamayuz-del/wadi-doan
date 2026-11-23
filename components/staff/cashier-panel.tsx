'use client'

import { useMemo, useState } from 'react'
import { Printer, ReceiptText, Wallet } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge, Card, Input, Select } from '@/components/ui/fields'
import { apiSend, useOrders } from '@/lib/client'
import { formatDateTime, sar } from '@/lib/format'
import { ORDER_TYPES, PAYMENT_METHODS, type Order } from '@/lib/types'

const PAY_LABEL = { paid: 'مدفوع', pending: 'عند الاستلام', review: 'مراجعة التحويل' }
const PAY_TONE = { paid: 'success', pending: 'neutral', review: 'warning' } as const

/** شاشة الكاشير: تحصيل وتأكيد المدفوعات وطباعة الفواتير والبونات. */
export function CashierPanel() {
  const { data: orders, mutate } = useOrders(5000)
  const [q, setQ] = useState('')
  const [showAll, setShowAll] = useState(false)

  const list = useMemo(
    () =>
      (orders ?? []).filter(
        (o) =>
          (showAll || o.payment.status !== 'paid') &&
          (!q.trim() ||
            String(o.number).includes(q.trim()) ||
            o.customerName.includes(q.trim()) ||
            o.phone.includes(q.trim())),
      ),
    [orders, q, showAll],
  )

  async function confirmPaid(id: string) {
    await apiSend<Order>(`/api/orders/${id}`, 'PATCH', { paymentStatus: 'paid' })
    await mutate()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          aria-label="بحث في الطلبات"
          placeholder="رقم الطلب أو الاسم أو الجوال"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select aria-label="نطاق العرض" value={showAll ? 'all' : 'due'} onChange={(e) => setShowAll(e.target.value === 'all')} className="w-44">
          <option value="due">الطلبات غير المسددة</option>
          <option value="all">كل الطلبات</option>
        </Select>
        <span className="text-sm text-muted-foreground">
          {list.length} طلب · الإجمالي {sar(list.reduce((s, o) => s + o.total, 0))}
        </span>
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
              <th className="p-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b align-top last:border-0">
                <td className="p-3 font-bold text-primary">{o.number}</td>
                <td className="p-3">
                  <p className="font-medium">{o.customerName}</p>
                  <p dir="ltr" className="text-right text-xs text-muted-foreground">
                    {o.phone}
                  </p>
                </td>
                <td className="p-3 text-xs">
                  {ORDER_TYPES.find((t) => t.id === o.type)?.label}
                  {o.table ? ` · طاولة ${o.table}` : ''}
                  {o.isBooking && <Badge tone="accent" className="mr-1">حجز</Badge>}
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
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {o.payment.status !== 'paid' && (
                      <Button size="sm" className="gap-1" onClick={() => confirmPaid(o.id)}>
                        <Wallet aria-hidden="true" />
                        تأكيد الدفع
                      </Button>
                    )}
                    <a
                      href={`/invoice/${o.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      <ReceiptText aria-hidden="true" />
                      فاتورة
                    </a>
                    <a
                      href={`/ticket/${o.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      <Printer aria-hidden="true" />
                      بون
                    </a>
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
