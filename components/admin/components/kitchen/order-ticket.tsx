'use client'

import { useState } from 'react'
import { Clock, Flame, MapPin, Printer, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/fields'
import { formatDateTime } from '@/lib/format'
import { CATEGORIES, ORDER_TYPES, SLAUGHTER_CATEGORIES, type Order, type OrderStatus } from '@/lib/types'
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
  onUpdate: (patch: Partial<{ status: OrderStatus; priority: Order['priority'] }>) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const next = NEXT[order.status]
  const minutes = Math.max(0, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000))
  const urgent = order.priority === 'urgent'

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
          <span className="text-xs text-muted-foreground">منذ {minutes} د</span>
        </div>
      </header>
      {order.pickupCode && (
        <p className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/5 px-2 py-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            كود الاستلام
          </span>
          <span dir="ltr" className="font-mono text-lg font-bold tracking-[0.3em] text-primary">
            {order.pickupCode}
          </span>
        </p>
      )}
      {order.scheduledAt && (
        <p className="flex items-center gap-1.5 rounded-md bg-accent/20 px-2 py-1 text-xs font-semibold">
          <Clock className="size-3.5" aria-hidden="true" />
          التسليم: {formatDateTime(order.scheduledAt)}
        </p>
      )}
      {order.type === 'delivery' && (order.shortAddress || order.lat !== undefined) && (
        <p className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {order.shortAddress && (
            <span dir="ltr" className="font-mono font-semibold">
              {order.shortAddress}
            </span>
          )}
          {order.lat !== undefined && order.lng !== undefined && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              عرض الموقع على الخريطة
            </a>
          )}
        </p>
      )}
      <ul className="flex flex-col gap-1 text-sm">
        {order.lines.map((l) => (
          <li key={`${l.itemId}-${l.options ?? ''}`} className="flex justify-between gap-2">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                {SLAUGHTER_CATEGORIES.includes(l.category) && (
                  <Badge tone="accent">{CATEGORIES.find((c) => c.id === l.category)?.label}</Badge>
                )}
                {l.name}
              </span>
              {l.options && <span className="block text-xs font-semibold text-primary">{l.options}</span>}
            </span>
            <span className="font-bold">× {l.qty}</span>
          </li>
        ))}
      </ul>
      {order.guests && <p className="text-xs text-muted-foreground">عدد الأشخاص: {order.guests}</p>}
      {order.notes && <p className="rounded-md bg-muted px-2 py-1 text-xs font-medium">ملاحظة: {order.notes}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {next && (
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
