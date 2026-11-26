'use client'

import { useMemo, useState } from 'react'
import { Archive, Calculator, Printer, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice, Select, Textarea } from '@/components/ui/fields'
import { apiSend, useCollection, useOrders, useSettings } from '@/lib/client'
import { formatDateTime, round2, sar } from '@/lib/format'
import { MONTHS, REPORT_PERIODS, type FinancialReport, type Purchase, type ReportPeriod } from '@/lib/types'
import { cn } from '@/lib/utils'

type Draft = Omit<FinancialReport, 'id' | 'createdAt'> & { id?: string }

const thisYear = new Date().getFullYear()
const YEARS = Array.from({ length: 7 }, (_, i) => thisYear - 3 + i)

function labelOf(period: ReportPeriod, year: number, month: number) {
  return period === 'monthly' ? `${MONTHS[month - 1]} ${year}` : `السنة المالية ${year}`
}

export function FinanceReports() {
  const { data: settings } = useSettings()
  const { data: orders } = useOrders()
  const { data: purchases } = useCollection<Purchase>('purchases')
  const { data: reports, mutate } = useCollection<FinancialReport>('reports')

  const [period, setPeriod] = useState<ReportPeriod>('monthly')
  const [year, setYear] = useState(thisYear)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [view, setView] = useState<FinancialReport | null>(null)
  const [msg, setMsg] = useState('')

  const netProfit = draft ? round2(draft.revenue - draft.purchases - draft.expenses) : 0

  /** يجمع بيانات الفترة المختارة من الطلبات والمشتريات المسجّلة تلقائيًا. */
  function generate() {
    setMsg('')
    const inPeriod = (iso: string) => {
      const d = new Date(iso)
      return d.getFullYear() === year && (period === 'annual' || d.getMonth() + 1 === month)
    }
    const periodOrders = (orders ?? []).filter((o) => o.status !== 'cancelled' && inPeriod(o.createdAt))
    const revenue = round2(periodOrders.reduce((s, o) => s + o.total, 0))
    const bought = round2(
      (purchases ?? [])
        .filter((p) => inPeriod(p.date || p.createdAt))
        .reduce((s, p) => s + p.amount, 0),
    )
    setDraft({
      period,
      year,
      month: period === 'monthly' ? month : undefined,
      label: labelOf(period, year, month),
      revenue,
      purchases: bought,
      expenses: draft?.expenses ?? 0,
      netProfit: round2(revenue - bought - (draft?.expenses ?? 0)),
      ordersCount: periodOrders.length,
      notes: draft?.notes ?? '',
    })
  }

  async function save() {
    if (!draft) return
    setMsg('')
    if (!draft.label.trim()) return setMsg('عنوان القائمة مطلوب')
    const { id, ...body } = draft
    if (id) await apiSend(`/api/db/reports/${id}`, 'PATCH', body)
    else await apiSend('/api/db/reports', 'POST', body)
    await mutate()
    setDraft(null)
    setView(null)
    setMsg('تم حفظ القائمة في الأرشيف')
  }

  const preview = useMemo<Draft | null>(() => draft ?? view ?? null, [draft, view])

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-5 print:hidden">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold">إنشاء قائمة مالية</h3>
            <Button variant="outline" onClick={() => setDraft({ period: 'monthly', year: thisYear, month, label: labelOf('monthly', thisYear, month), revenue: 0, purchases: 0, expenses: 0, netProfit: 0, ordersCount: 0, notes: '' })}>
              إدخال يدوي
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="نوع القائمة">
              <Select
                value={period}
                onChange={(e) => {
                  const next = e.target.value as ReportPeriod
                  setPeriod(next)
                  setDraft((d) => (d ? { ...d, period: next, month: next === 'monthly' ? month : undefined, label: labelOf(next, year, month) } : d))
                }}
              >
                {REPORT_PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="السنة">
              <Select
                value={year}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setYear(next)
                  setDraft((d) => (d ? { ...d, year: next, label: labelOf(period, next, month) } : d))
                }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الشهر">
              <Select
                value={month}
                disabled={period === 'annual'}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setMonth(next)
                  setDraft((d) => (d ? { ...d, month: period === 'monthly' ? next : undefined, label: labelOf(period, year, next) } : d))
                }}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Button variant="secondary" onClick={generate}>
            <Calculator aria-hidden="true" />
            احتساب الإيرادات والمشتريات تلقائيًا
          </Button>

          {draft && (
            <div className="grid gap-3 rounded-lg border border-primary bg-muted/40 p-4 sm:grid-cols-2">
              <Field label="الإيرادات">
                <Input type="number" value={draft.revenue} onChange={(e) => setDraft({ ...draft, revenue: Number(e.target.value) })} />
              </Field>
              <Field label="المشتريات">
                <Input type="number" value={draft.purchases} onChange={(e) => setDraft({ ...draft, purchases: Number(e.target.value) })} />
              </Field>
              <Field label="المصروفات الأخرى">
                <Input type="number" value={draft.expenses} onChange={(e) => setDraft({ ...draft, expenses: Number(e.target.value) })} />
              </Field>
              <Field label="عدد الطلبات">
                <Input type="number" value={draft.ordersCount} onChange={(e) => setDraft({ ...draft, ordersCount: Number(e.target.value) })} />
              </Field>
              <Field label="صافي الربح (تلقائي)">
                <Input readOnly value={netProfit} className="bg-muted font-semibold" />
              </Field>
              <Field label="عنوان القائمة">
                <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </Field>
              <Field label="ملاحظات" className="sm:col-span-2">
                <Textarea value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button onClick={save}>
                  <Save aria-hidden="true" />
                  حفظ في الأرشيف
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer aria-hidden="true" />
                  طباعة
                </Button>
                <Button variant="outline" onClick={() => setDraft(null)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
          {msg && <Notice className={msg.startsWith('تم') ? 'bg-emerald-600/10 text-emerald-700' : undefined}>{msg}</Notice>}
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
            <Archive className="size-4" aria-hidden="true" />
            أرشيف القوائم المالية
          </h3>
          {(!reports || reports.length === 0) && <p className="py-3 text-center text-sm text-muted-foreground">لا توجد قوائم محفوظة بعد</p>}
          <ul className="flex flex-col divide-y">
            {reports?.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                <button type="button" className="flex min-w-0 flex-1 flex-col items-start text-right" onClick={() => { setView(r); setDraft(null); setPeriod(r.period); setYear(r.year); setMonth(r.month ?? 1) }}>
                  <span className="truncate text-sm font-medium">{r.label}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge tone={r.period === 'annual' ? 'accent' : 'primary'}>{r.period === 'annual' ? 'سنوية' : 'شهرية'}</Badge>
                    <span>صافي الربح {sar(r.netProfit)}</span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`حذف ${r.label}`}
                  onClick={async () => {
                    if (!confirm('حذف القائمة المالية؟')) return
                    await apiSend(`/api/db/reports/${r.id}`, 'DELETE')
                    if (view?.id === r.id) setView(null)
                    await mutate()
                  }}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section aria-label="معاينة القائمة المالية" className="print:col-span-full">
        <div className="mb-3 flex justify-end print:hidden">
          <Button variant="secondary" disabled={!preview} onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            طباعة القائمة
          </Button>
        </div>
        <ReportPreview draft={preview} netProfit={preview ? round2(preview.revenue - preview.purchases - preview.expenses) : 0} settings={settings} />
      </section>
    </div>
  )
}

function ReportPreview({
  draft,
  netProfit,
  settings,
}: {
  draft: Draft | FinancialReport | null
  netProfit: number
  settings?: { name: string; logo: string; vatNumber: string; crNumber: string; city: string; district: string; phone: string; phone2: string; whatsapp: string; email: string; primaryColor: string }
}) {
  const periodLabel = draft?.period === 'annual' ? 'قائمة مالية سنوية' : 'قائمة مالية شهرية'
  const rows = [
    { label: 'الإيرادات', value: draft?.revenue ?? 0, positive: true },
    { label: 'المشتريات', value: draft?.purchases ?? 0, positive: false },
    { label: 'المصروفات', value: draft?.expenses ?? 0, positive: false },
  ]
  return (
    <div className="letter-a4 mx-auto flex aspect-[1/1.414] w-full max-w-[210mm] flex-col bg-white text-[13px] text-neutral-900 shadow-lg ring-1 ring-black/5 print:aspect-auto print:max-w-none print:w-[210mm] print:min-h-[296mm] print:shadow-none print:ring-0">
      <div className="flex flex-1 flex-col px-8 pb-6 pt-8 print:px-[18mm] print:pb-[8mm] print:pt-[14mm]">
        <header className="flex items-start justify-between gap-4 border-b-2 pb-4" style={{ borderColor: settings?.primaryColor }}>
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <img src={settings.logo} alt="" className="size-16 rounded-full border object-cover" />
            ) : null}
            <div className="text-right">
              <p className="text-[15px] font-bold">{settings?.name ?? 'مطاعم ومطابخ وادي دوعن'}</p>
              <p className="text-[11px] text-neutral-600">
                {[settings?.city, settings?.district].filter(Boolean).join(' - ')}
              </p>
              <p className="text-[11px] text-neutral-600">الرقم الضريبي: {settings?.vatNumber}</p>
              <p className="text-[11px] text-neutral-600">السجل التجاري: {settings?.crNumber}</p>
            </div>
          </div>
          <div className="text-left">
            <h1 className="font-heading text-lg font-bold">{periodLabel}</h1>
            <p className="text-[12px] font-semibold text-neutral-700">{draft?.label ?? '—'}</p>
            {draft?.createdAt && <p className="text-[10px] text-neutral-500">{formatDateTime(draft.createdAt)}</p>}
          </div>
        </header>

        <table className="mt-8 w-full text-[13px]">
          <thead>
            <tr className="text-right text-white" style={{ backgroundColor: settings?.primaryColor }}>
              <th className="p-2.5 font-semibold">البند</th>
              <th className="p-2.5 text-left font-semibold">المبلغ (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b">
                <td className="p-2.5 font-medium">{r.label}</td>
                <td className={cn('p-2.5 text-left font-mono', !r.positive && 'text-neutral-600')}>
                  {r.positive ? '' : '- '}
                  {sar(r.value)}
                </td>
              </tr>
            ))}
            <tr className="border-b-2" style={{ borderColor: settings?.primaryColor }}>
              <td className="p-2.5 font-bold">صافي الربح</td>
              <td className="p-2.5 text-left font-mono text-base font-bold" style={{ color: settings?.primaryColor }}>
                {sar(netProfit)}
              </td>
            </tr>
            <tr>
              <td className="p-2.5 text-neutral-600">عدد الطلبات خلال الفترة</td>
              <td className="p-2.5 text-left font-mono">{draft?.ordersCount ?? 0}</td>
            </tr>
          </tbody>
        </table>

        {draft?.notes && (
          <div className="mt-6 rounded-lg border bg-neutral-50 p-3">
            <p className="mb-1 text-[11px] font-semibold text-neutral-600">ملاحظات</p>
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{draft.notes}</p>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-8 pt-10">
          <div className="text-[12px]">
            <p className="text-neutral-600">أُعدّت هذه القائمة إلكترونيًا من نظام</p>
            <p className="font-semibold">{settings?.name}</p>
          </div>
          <div className="flex w-56 flex-col items-center text-center text-[12px]">
            <p className="font-semibold">المدير المالي</p>
            <span className="mt-8 block w-full border-b border-dotted border-neutral-500" />
            <p className="mt-1 text-neutral-500">التوقيع والختم</p>
          </div>
        </div>
      </div>
      <footer className="mt-auto w-full px-8 py-3 text-center text-[11px] leading-relaxed text-white print:px-[18mm]" style={{ backgroundColor: settings?.primaryColor }}>
        <p>
          {[settings?.phone, settings?.phone2].filter(Boolean).join(' - ')}
          {settings?.whatsapp ? ` · واتساب ${settings.whatsapp}` : ''}
          {settings?.email ? ` · ${settings.email}` : ''}
        </p>
      </footer>
    </div>
  )
}
