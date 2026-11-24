'use client'

import { useMemo, useState } from 'react'
import { Printer, ReceiptText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge, Card, Input } from '@/components/ui/fields'
import { useOrders } from '@/lib/client'
import { formatDateTime, sar } from '@/lib/format'
import { ORDER_STATUS_LABEL } from '@/lib/types'

const STATUS_TONE = { new: 'danger', preparing: 'accent', ready: 'primary', completed: 'success', settled: 'success', cancelled: 'neutral' } as const
const PAY_LABEL = { paid: 'مدفوع', pending: 'عند الاستلام', review: 'مراجعة التحويل' } as const

/** محطة الطباعة السريعة: اختر الطلب واطبع الفاتورة الضريبية أو بون المطبخ. */
export function PrintPanel() {
  const { data: orders } = useOrders(8000)
  const [q, setQ] = useState('')

  const list = useMemo(
    () =>
      (orders ?? []).filter(
        (o) =>
          !q.trim() ||
          String(o.number).includes(q.trim()) ||
          o.customerName.includes(q.trim()) ||
          o.phone.includes(q.trim()),
      ),
    [orders, q],
  )

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="search"
        aria-label="بحث في الطلبات"
        placeholder="ابحث برقم الطلب أو اسم العميل أو الجوال"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />
      {list.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">لا توجد طلبات مطابقة</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((o) => (
            <li key={o.id}>
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading text-lg font-bold">#{o.number}</p>
                    <p className="text-sm font-medium">{o.customerName}</p>
                    <p dir="ltr" className="text-right text-xs text-muted-foreground">
                      {o.phone}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    <Badge tone={o.payment.status === 'paid' ? 'success' : 'warning'}>{PAY_LABEL[o.payment.status]}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                <p className="font-semibold text-primary">{sar(o.total)}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/invoice/${o.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'default', size: 'sm' })}
                  >
                    <ReceiptText aria-hidden="true" />
                    طباعة الفاتورة
                  </a>
                  <a
                    href={`/ticket/${o.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <Printer aria-hidden="true" />
                    بون المطبخ
                  </a>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
