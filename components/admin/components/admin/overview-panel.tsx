'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/fields'
import { useCollection, useOrders } from '@/lib/client'
import { round2, sar } from '@/lib/format'
import { CATEGORIES, PAYMENT_METHODS, type Complaint, type Purchase } from '@/lib/types'

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export function OverviewPanel() {
  const { data: orders } = useOrders(10000)
  const { data: purchases } = useCollection<Purchase>('purchases')
  const { data: complaints } = useCollection<Complaint>('complaints')

  const stats = useMemo(() => {
    const valid = (orders ?? []).filter((o) => o.status !== 'cancelled')
    const sales = valid.reduce((s, o) => s + o.total, 0)
    const vat = valid.reduce((s, o) => s + o.vat, 0)
    const spend = (purchases ?? []).reduce((s, p) => s + p.amount, 0)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return dayKey(d)
    })
    const byDay = days.map((day) => ({
      day,
      total: round2(valid.filter((o) => o.createdAt.slice(0, 10) === day).reduce((s, o) => s + o.total, 0)),
    }))
    const byCategory = CATEGORIES.map((c) => ({
      label: c.label,
      total: round2(valid.reduce((s, o) => s + o.lines.filter((l) => l.category === c.id).reduce((a, l) => a + l.unitPrice * l.qty, 0), 0)),
    })).filter((c) => c.total > 0)
    const byPayment = PAYMENT_METHODS.map((p) => ({
      label: p.label,
      total: round2(valid.filter((o) => o.payment.method === p.id).reduce((s, o) => s + o.total, 0)),
    })).filter((p) => p.total > 0)
    return {
      sales,
      vat,
      spend,
      count: valid.length,
      avg: valid.length ? sales / valid.length : 0,
      active: valid.filter((o) => ['new', 'preparing', 'ready'].includes(o.status)).length,
      openComplaints: (complaints ?? []).filter((c) => c.status === 'open').length,
      byDay,
      byCategory,
      byPayment,
    }
  }, [orders, purchases, complaints])

  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.total))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="إجمالي المبيعات" value={sar(round2(stats.sales))} />
        <Stat label="عدد الطلبات" value={String(stats.count)} hint={`${stats.active} طلب نشط الآن`} />
        <Stat label="متوسط الطلب" value={sar(round2(stats.avg))} />
        <Stat label="ضريبة القيمة المضافة" value={sar(round2(stats.vat))} />
        <Stat label="إجمالي المشتريات" value={sar(round2(stats.spend))} />
        <Stat label="صافي تقريبي" value={sar(round2(stats.sales - stats.vat - stats.spend))} />
        <Stat label="شكاوى مفتوحة" value={String(stats.openComplaints)} />
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-heading text-lg font-bold">المبيعات خلال آخر 7 أيام</h3>
        <div className="flex h-52 items-end gap-2" role="img" aria-label="مخطط أعمدة للمبيعات اليومية">
          {stats.byDay.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] text-muted-foreground">{d.total > 0 ? Math.round(d.total) : ''}</span>
              <div className="w-full rounded-t-md bg-primary transition-all" style={{ height: `${(d.total / maxDay) * 85}%`, minHeight: 2 }} />
              <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Breakdown title="المبيعات حسب التصنيف" rows={stats.byCategory} />
        <Breakdown title="المبيعات حسب طريقة الدفع" rows={stats.byPayment} />
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-heading text-xl font-bold">{value}</span>
      {hint && <span className="text-xs text-primary">{hint}</span>}
    </Card>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; total: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total))
  return (
    <Card className="p-5">
      <h3 className="mb-4 font-heading text-lg font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد بيانات بعد</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.label} className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span>{r.label}</span>
                <span className="font-semibold">{sar(r.total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
