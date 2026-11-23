'use client'

import { useState } from 'react'
import { Clock, Flame, Printer, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Input } from '@/components/ui/fields'
import { formatDateTime } from '@/lib/format'
import { ORDER_TYPES, type Order, type OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'preparing', label: 'بدء التجهيز' },
  preparing: { status: 'ready', label: 'جاهز للتسليم' },
  ready: { status: 'completed', label: 'تم التسليم' },
}

export function OrderTicket({
  order,
  onUpdate,
}: {
  order: Order
  onUpdate: (patch: Partial<{ status: OrderStatus; priority: Order['priority']; pickupCode: string }>) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const next = NEXT[order.status]
  const minutes = Math.max(0, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000))
  const urgent = order.priority === 'urgent'
  // الطلبات المدفوعة إلكترونيًا لا تُسلَّم إلا بإدخال كود الاستلام المطابق.
  const gateDelivery = next?.status === 'completed' && Boolean(order.requiresPickupCode)

  async function run(patch: Parameters<typeof onUpdate>[0]) {
    setBusy(true)
    setError('')
    try {
      await onUpdate(patch)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={cn('flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm', urgent && 'border-destructive ring-2 ring-destructive/30')}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-2xl font-bold">#{order.number}</p>
          <p className="text-xs text-muted-foreground">
            {ORDER_TYPES.find((t) => t.id === order.type)?.label}
            {order.table ? ` · طاولة ${order.table}` : ''}
            {order.zoneName ? ` · ${order.zoneName}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {urgent && (
            <Badge tone="danger">
              <Flame className="size-3" aria-hidden="true" />
              عاجل
            </Badge>
          )}
          {order.isBooking && <Badge tone="accent">حجز</Badge>}
          {order.requiresPickupCode && (
            <Badge tone="primary">
              <ShieldCheck className="size-3" aria-hidden="true" />
              كود استلام
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">منذ {minutes} د</span>
        </div>
      </header>
      {order.scheduledAt && (
        <p className="flex items-center gap-1.5 rounded-md bg-accent/20 px-2 py-1 text-xs font-semibold">
          <Clock className="size-3.5" aria-hidden="true" />
          التسليم: {formatDateTime(order.scheduledAt)}
        </p>
      )}
      <ul className="flex flex-col gap-1 text-sm">
        {order.lines.map((l) => (
          <li key={`${l.itemId}-${l.options ?? ''}`} className="flex justify-between gap-2">
            <span>
              {l.name}
              {l.options && <span className="block text-xs text-muted-foreground">{l.options}</span>}
            </span>
            <span className="font-bold">× {l.qty}</span>
          </li>
        ))}
      </ul>
      {order.guests && <p className="text-xs text-muted-foreground">عدد الأشخاص: {order.guests}</p>}
      {order.notes && <p className="rounded-md bg-muted px-2 py-1 text-xs font-medium">ملاحظة: {order.notes}</p>}
      {gateDelivery && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-2">
          <label htmlFor={`pickup-${order.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            أدخل كود الاستلام للتسليم (5 أرقام)
          </label>
          <div className="flex gap-2">
            <Input
              id={`pickup-${order.id}`}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              inputMode="numeric"
              dir="ltr"
              placeholder="- - - - -"
              className="h-9 flex-1 text-center font-mono tracking-widest"
            />
            <Button disabled={busy || code.length !== 5} onClick={() => run({ status: 'completed', pickupCode: code })}>
              تم التسليم
            </Button>
          </div>
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {next && !gateDelivery && (
          <Button className="flex-1" disabled={busy} onClick={() => run({ status: next.status })}>
            {next.label}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          aria-label={urgent ? 'إلغاء الأولوية العاجلة' : 'تعيين كعاجل'}
          aria-pressed={urgent}
          disabled={busy}
          onClick={() => run({ priority: urgent ? 'normal' : 'urgent' })}
        >
          <Flame className={urgent ? 'text-destructive' : undefined} />
        </Button>
        <Button variant="outline" size="icon" aria-label="طباعة البون" onClick={() => window.open(`/ticket/${order.id}`, '_blank', 'noopener')}>
          <Printer />
        </Button>
      </div>
    </article>
  )
}
