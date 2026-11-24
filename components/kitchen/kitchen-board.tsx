'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Select } from '@/components/ui/fields'
import { apiSend, useOrders } from '@/lib/client'
import type { Order, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { OrderTicket } from './order-ticket'

const COLUMNS: { status: OrderStatus; label: string; tone: string }[] = [
  { status: 'new', label: 'جديد', tone: 'border-t-destructive' },
  { status: 'preparing', label: 'قيد التجهيز', tone: 'border-t-accent' },
  { status: 'ready', label: 'جاهز للتسليم', tone: 'border-t-emerald-600' },
]

type Filter = 'all' | 'restaurant' | 'booking'

function sortOrders(a: Order, b: Order) {
  if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1
  const ta = new Date(a.scheduledAt ?? a.createdAt).getTime()
  const tb = new Date(b.scheduledAt ?? b.createdAt).getTime()
  return ta - tb
}

function beep(ctx: AudioContext) {
  const now = ctx.currentTime
  for (const [i, freq] of [880, 1175, 880].entries()) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.25, now + i * 0.2)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.18)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.2)
    osc.stop(now + i * 0.2 + 0.2)
  }
}

export function KitchenBoard() {
  const { data: orders, mutate } = useOrders(3000)
  const [soundOn, setSoundOn] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [flash, setFlash] = useState(false)
  const seen = useRef<Set<string> | null>(null)
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!orders) return
    if (!seen.current) {
      seen.current = new Set(orders.map((o) => o.id))
      return
    }
    const fresh = orders.filter((o) => !seen.current!.has(o.id))
    if (fresh.length === 0) return
    for (const o of fresh) seen.current.add(o.id)
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 2500)
    if (soundOn && audio.current) beep(audio.current)
    return () => clearTimeout(t)
  }, [orders, soundOn])

  function toggleSound() {
    if (!audio.current) audio.current = new AudioContext()
    void audio.current.resume()
    if (!soundOn) beep(audio.current)
    setSoundOn((s) => !s)
  }

  const active = useMemo(
    () =>
      (orders ?? []).filter(
        (o) =>
          ['new', 'preparing', 'ready'].includes(o.status) &&
          (filter === 'all' || (filter === 'booking' ? o.isBooking : !o.isBooking)),
      ),
    [orders, filter],
  )

  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of active) {
      if (o.status === 'ready') continue
      for (const l of o.lines) map.set(l.name, (map.get(l.name) ?? 0) + l.qty)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [active])

  async function update(id: string, patch: Partial<{ status: OrderStatus; priority: Order['priority'] }>) {
    await mutate(
      async (current) => {
        const updated = await apiSend<Order>(`/api/orders/${id}`, 'PATCH', patch)
        return current?.map((o) => (o.id === id ? updated : o))
      },
      { revalidate: false },
    )
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl font-bold">شاشة المطبخ</h1>
          <span
            className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', flash ? 'animate-pulse bg-destructive text-white' : 'bg-muted')}
            aria-live="polite"
          >
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {flash ? 'وصل طلب جديد!' : 'متصل - تحديث لحظي'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="تصفية الطلبات" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="w-48">
            <option value="all">كل الطلبات</option>
            <option value="restaurant">طلبات المطعم الفورية</option>
            <option value="booking">الذبائح والأضاحي والولائم والإعاشة</option>
          </Select>
          <Button variant={soundOn ? 'default' : 'outline'} size="lg" onClick={toggleSound} aria-pressed={soundOn}>
            {soundOn ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}
            {soundOn ? 'التنبيه الصوتي مفعّل' : 'تفعيل التنبيه الصوتي'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = active.filter((o) => o.status === col.status).sort(sortOrders)
            return (
              <section key={col.status} aria-label={col.label} className={cn('flex flex-col gap-3 rounded-2xl border border-t-4 bg-muted/40 p-3', col.tone)}>
                <h2 className="flex items-center justify-between px-1 font-heading text-lg font-bold">
                  {col.label}
                  <Badge>{list.length}</Badge>
                </h2>
                {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات</p>}
                {list.map((o) => (
                  <OrderTicket key={o.id} order={o} onUpdate={(patch) => update(o.id, patch)} />
                ))}
              </section>
            )
          })}
        </div>
        <Card className="h-fit p-4 xl:sticky xl:top-20">
          <h2 className="mb-3 font-heading text-lg font-bold">الكميات المطلوبة</h2>
          {totals.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد كميات قيد التحضير</p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {totals.map(([name, qty]) => (
                <li key={name} className="flex justify-between gap-2 py-2">
                  <span>{name}</span>
                  <span className="font-bold text-primary">{qty}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  )
}
