import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getOrder } from '@/lib/data'
import { formatDateTime } from '@/lib/format'
import { ORDER_TYPES } from '@/lib/types'
import { PrintButton } from '@/components/print-button'

export const metadata: Metadata = { title: 'بون المطبخ', robots: { index: false } }

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  // الطلب الإلكتروني عند طباعة البون ينتقل تلقائيًا إلى «قيد التجهيز».
  const prepareOrderId = order.type !== 'dinein' && order.status === 'new' ? order.id : undefined

  return (
    <main className="mx-auto flex max-w-xs flex-col gap-3 p-4 font-mono text-sm">
      <PrintButton label="طباعة البون" auto prepareOrderId={prepareOrderId} />
      <div className="flex flex-col gap-2 border-y-2 border-dashed border-foreground py-3 text-center">
        <p className="text-3xl font-bold">#{order.number}</p>
        <p className="font-bold">
          {ORDER_TYPES.find((t) => t.id === order.type)?.label}
          {order.table ? ` - طاولة ${order.table}` : ''}
        </p>
        {order.priority === 'urgent' && <p className="bg-foreground py-1 font-bold text-background">عاجل</p>}
        <p>{formatDateTime(order.createdAt)}</p>
        {order.scheduledAt && <p className="font-bold">التسليم: {formatDateTime(order.scheduledAt)}</p>}
        {order.pickupCode && (
          <p className="border-t-2 border-dashed border-foreground pt-2">
            كود الاستلام: <span dir="ltr" className="text-xl font-bold tracking-[0.3em]">{order.pickupCode}</span>
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {order.lines.map((l) => (
          <li key={`${l.itemId}-${l.options ?? ''}`} className="flex justify-between gap-2 text-base">
            <span>
              {l.name}
              {l.options && <span className="block text-xs">{l.options}</span>}
            </span>
            <span className="font-bold">× {l.qty}</span>
          </li>
        ))}
      </ul>
      {order.guests && <p>عدد الأشخاص: {order.guests}</p>}
      {order.notes && <p className="border-t-2 border-dashed border-foreground pt-2 font-bold">ملاحظات: {order.notes}</p>}
      {(order.customerName || order.phone) && (
        <p className="border-t-2 border-dashed border-foreground pt-2 text-center">
          {order.customerName}
          {order.customerName && order.phone ? ' - ' : ''}
          {order.phone && <span dir="ltr">{order.phone}</span>}
        </p>
      )}
    </main>
  )
}
