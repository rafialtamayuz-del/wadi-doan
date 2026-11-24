'use client'

import { useState } from 'react'
import { Building2, FilePlus2, Plus, Printer, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice, Textarea } from '@/components/ui/fields'
import { QrBlock } from '@/components/invoice/qr-block'
import { apiSend, useCollection, useSettings } from '@/lib/client'
import { VAT_RATE, formatDate, round2, sar, zatcaQrBase64 } from '@/lib/format'
import type { CompanyInvoice, InvoiceLine } from '@/lib/types'

type Draft = Omit<CompanyInvoice, 'id' | 'createdAt'> & { id?: string }

const today = () => new Date().toISOString().slice(0, 10)
const emptyLine = (): InvoiceLine => ({ description: '', qty: 1, unitPrice: 0 })

/** فاتورة للشركات والمؤسسات والقطاعات الحكومية (B2B) بترويسة رسمية جاهزة للطباعة. */
export function CompanyInvoices() {
  const { data: settings } = useSettings()
  const { data: invoices, mutate } = useCollection<CompanyInvoice>('invoices')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [view, setView] = useState<CompanyInvoice | null>(null)
  const [msg, setMsg] = useState('')

  function newDraft() {
    setMsg('')
    const seq = String((invoices?.length ?? 0) + 1).padStart(3, '0')
    setDraft({
      number: `B2B-${today().slice(0, 4)}-${seq}`,
      date: today(),
      buyerName: '',
      buyerAddress: '',
      buyerCr: '',
      buyerVat: '',
      lines: [emptyLine()],
      notes: '',
    })
    setView(null)
  }

  function setLine(index: number, patch: Partial<InvoiceLine>) {
    if (!draft) return
    setDraft({ ...draft, lines: draft.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) })
  }

  function addLine() {
    if (!draft) return
    setDraft({ ...draft, lines: [...draft.lines, emptyLine()] })
  }

  function removeLine(index: number) {
    if (!draft) return
    setDraft({ ...draft, lines: draft.lines.filter((_, i) => i !== index) })
  }

  async function save() {
    if (!draft) return
    setMsg('')
    if (!draft.buyerName.trim()) return setMsg('اسم المنشأة المشترية مطلوب')
    const lines = draft.lines.filter((l) => l.description.trim() && l.qty > 0)
    if (lines.length === 0) return setMsg('أضف بندًا واحدًا على الأقل للفاتورة')
    const { id, ...body } = { ...draft, lines }
    if (id) await apiSend(`/api/db/invoices/${id}`, 'PATCH', body)
    else await apiSend('/api/db/invoices', 'POST', body)
    await mutate()
    setDraft(null)
    setMsg('تم حفظ الفاتورة وأرشفتها')
  }

  const preview: Draft | CompanyInvoice | null = draft ?? view
  const lines = preview?.lines ?? []
  const subtotal = round2(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0))
  const vat = round2(subtotal * VAT_RATE)
  const total = round2(subtotal + vat)

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-5 print:hidden">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
              <Building2 className="size-4" aria-hidden="true" />
              فاتورة الشركات والمؤسسات
            </h3>
            <Button variant="outline" onClick={newDraft}>
              <FilePlus2 aria-hidden="true" />
              فاتورة جديدة
            </Button>
          </div>

          {draft && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="رقم الفاتورة">
                  <Input dir="ltr" value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} />
                </Field>
                <Field label="التاريخ">
                  <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </Field>
                <Field label="اسم المنشأة المشترية">
                  <Input value={draft.buyerName} onChange={(e) => setDraft({ ...draft, buyerName: e.target.value })} />
                </Field>
                <Field label="السجل التجاري">
                  <Input dir="ltr" value={draft.buyerCr} onChange={(e) => setDraft({ ...draft, buyerCr: e.target.value })} />
                </Field>
                <Field label="عنوان المنشأة" className="sm:col-span-2">
                  <Input value={draft.buyerAddress} onChange={(e) => setDraft({ ...draft, buyerAddress: e.target.value })} />
                </Field>
                <Field label="الرقم الضريبي للمشتري (اختياري)" hint="خانة اختيارية غير ملزمة" className="sm:col-span-2">
                  <Input dir="ltr" value={draft.buyerVat ?? ''} onChange={(e) => setDraft({ ...draft, buyerVat: e.target.value })} placeholder="غير ملزم" />
                </Field>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <span className="text-sm font-medium">بنود الفاتورة</span>
                {draft.lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_4rem_6rem_auto] items-center gap-2">
                    <Input aria-label="الوصف" placeholder="الوصف" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                    <Input aria-label="الكمية" type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} />
                    <Input aria-label="سعر الوحدة" type="number" min={0} value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })} />
                    <Button variant="ghost" size="icon" aria-label="حذف البند" disabled={draft.lines.length === 1} onClick={() => removeLine(i)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus aria-hidden="true" />
                  إضافة بند
                </Button>
              </div>

              <Field label="ملاحظات">
                <Textarea value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <span>الإجمالي قبل الضريبة: {sar(subtotal)}</span>
                <span>الضريبة 15%: {sar(vat)}</span>
                <span className="font-bold text-primary">الإجمالي: {sar(total)}</span>
              </div>

              {msg && <Notice className={msg.startsWith('تم') ? 'bg-emerald-600/10 text-emerald-700' : undefined}>{msg}</Notice>}

              <div className="flex flex-wrap gap-2">
                <Button onClick={save}>
                  <Save aria-hidden="true" />
                  حفظ وأرشفة
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer aria-hidden="true" />
                  طباعة
                </Button>
                <Button variant="outline" onClick={() => setDraft(null)}>
                  إلغاء
                </Button>
              </div>
            </>
          )}
          {!draft && <p className="text-sm text-muted-foreground">أنشئ فاتورة جديدة أو اختر فاتورة من الأرشيف لعرضها وطباعتها.</p>}
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h3 className="font-heading text-lg font-bold">أرشيف فواتير الشركات</h3>
          {(!invoices || invoices.length === 0) && <p className="py-3 text-center text-sm text-muted-foreground">لا توجد فواتير مؤرشفة بعد</p>}
          <ul className="flex flex-col divide-y">
            {invoices?.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2 py-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col items-start text-right"
                  onClick={() => {
                    setView(inv)
                    setDraft(null)
                  }}
                >
                  <span className="truncate text-sm font-medium">{inv.buyerName}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge dir="ltr">{inv.number}</Badge>
                    {inv.date && <span>{formatDate(inv.date)}</span>}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`حذف فاتورة ${inv.buyerName}`}
                  onClick={async () => {
                    if (!confirm('حذف فاتورة الشركة؟')) return
                    await apiSend(`/api/db/invoices/${inv.id}`, 'DELETE')
                    if (view?.id === inv.id) setView(null)
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

      <section aria-label="معاينة فاتورة الشركة" className="print:col-span-full">
        <div className="mb-3 flex justify-end print:hidden">
          <Button variant="secondary" disabled={!preview} onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            طباعة الفاتورة
          </Button>
        </div>
        <InvoicePreview
          preview={preview}
          subtotal={subtotal}
          vat={vat}
          total={total}
          settings={settings}
        />
      </section>
    </div>
  )
}

function InvoicePreview({
  preview,
  subtotal,
  vat,
  total,
  settings,
}: {
  preview: Draft | CompanyInvoice | null
  subtotal: number
  vat: number
  total: number
  settings?: {
    name: string
    logo: string
    vatNumber: string
    crNumber: string
    city: string
    district: string
    phone: string
    phone2: string
    whatsapp: string
    email: string
    primaryColor: string
  }
}) {
  const qr =
    settings && preview
      ? zatcaQrBase64({
          seller: settings.name,
          vatNumber: settings.vatNumber,
          timestamp: preview.date || new Date().toISOString(),
          total,
          vat,
        })
      : ''
  return (
    <div className="letter-a4 mx-auto flex aspect-[1/1.414] w-full max-w-[210mm] flex-col bg-white text-[12px] text-neutral-900 shadow-lg ring-1 ring-black/5 print:aspect-auto print:max-w-none print:w-[210mm] print:min-h-[296mm] print:shadow-none print:ring-0">
      <div className="flex flex-1 flex-col px-8 pb-6 pt-8 print:px-[18mm] print:pb-[8mm] print:pt-[14mm]">
        <header className="flex items-start justify-between gap-4 border-b-2 pb-4" style={{ borderColor: settings?.primaryColor }}>
          <div className="flex items-center gap-3">
            {settings?.logo ? <img src={settings.logo} alt="" className="size-16 rounded-full border object-cover" /> : null}
            <div className="text-right">
              <p className="text-[15px] font-bold">{settings?.name ?? 'مطاعم ومطابخ وادي دوعن'}</p>
              <p className="text-[11px] text-neutral-600">{[settings?.city, settings?.district].filter(Boolean).join(' - ')}</p>
              <p className="text-[11px] text-neutral-600">الرقم الضريبي: {settings?.vatNumber}</p>
              <p className="text-[11px] text-neutral-600">السجل التجاري: {settings?.crNumber}</p>
            </div>
          </div>
          <div className="text-left">
            <h1 className="font-heading text-lg font-bold">فاتورة ضريبية</h1>
            <p className="text-[11px] text-neutral-600">Tax Invoice</p>
            <p className="mt-1 text-[12px] font-semibold" dir="ltr">
              {preview?.number || '—'}
            </p>
            <p className="text-[11px] text-neutral-600">{preview?.date ? formatDate(preview.date) : '—'}</p>
          </div>
        </header>

        <section className="mt-5 rounded-lg border bg-neutral-50 p-3">
          <p className="mb-1.5 text-[11px] font-bold text-neutral-600">بيانات المشتري</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
            <Row label="المنشأة" value={preview?.buyerName || '—'} />
            <Row label="السجل التجاري" value={preview?.buyerCr || '—'} />
            <Row label="العنوان" value={preview?.buyerAddress || '—'} />
            <Row label="الرقم الضريبي" value={preview?.buyerVat?.trim() ? preview.buyerVat : 'غير مُدخل (اختياري)'} />
          </dl>
        </section>

        <table className="mt-5 w-full text-[12px]">
          <thead>
            <tr className="text-right text-white" style={{ backgroundColor: settings?.primaryColor }}>
              <th className="p-2 font-semibold">الوصف</th>
              <th className="p-2 font-semibold">الكمية</th>
              <th className="p-2 font-semibold">سعر الوحدة</th>
              <th className="p-2 text-left font-semibold">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {preview?.lines.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{l.description || '—'}</td>
                <td className="p-2">{l.qty}</td>
                <td className="p-2 font-mono">{sar(l.unitPrice)}</td>
                <td className="p-2 text-left font-mono">{sar(round2(l.qty * l.unitPrice))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 flex items-end justify-between gap-6">
          {qr && <QrBlock value={qr} />}
          <dl className="flex w-full max-w-64 flex-col gap-1 text-[12px]">
            <div className="flex justify-between">
              <dt className="text-neutral-600">الإجمالي قبل الضريبة</dt>
              <dd className="font-mono">{sar(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">ضريبة القيمة المضافة 15%</dt>
              <dd className="font-mono">{sar(vat)}</dd>
            </div>
            <div className="flex justify-between border-t-2 pt-2 text-[14px] font-bold" style={{ borderColor: settings?.primaryColor }}>
              <dt>الإجمالي المستحق</dt>
              <dd className="font-mono" style={{ color: settings?.primaryColor }}>
                {sar(total)}
              </dd>
            </div>
          </dl>
        </div>

        {preview?.notes && (
          <div className="mt-5 rounded-lg border bg-neutral-50 p-3">
            <p className="mb-1 text-[11px] font-semibold text-neutral-600">ملاحظات</p>
            <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{preview.notes}</p>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-8 pt-8">
          <div className="flex flex-col items-center gap-1">
            <div
              aria-label="الختم الرسمي"
              className="flex size-24 rotate-[-12deg] flex-col items-center justify-center rounded-full border-[3px] border-double text-center text-[10px] font-bold leading-tight"
              style={{ borderColor: settings?.primaryColor, color: settings?.primaryColor }}
            >
              <span className="px-2">{settings?.name}</span>
              <span className="mt-1 text-[9px]">س.ت {settings?.crNumber}</span>
            </div>
          </div>
          <div className="flex w-56 flex-col items-center text-center text-[12px]">
            <p className="font-semibold">المدير العام</p>
            <span className="mt-8 block w-full border-b border-dotted border-neutral-500" />
            <p className="mt-1 text-neutral-500">التوقيع</p>
          </div>
        </div>
      </div>
      <footer className="mt-auto w-full px-8 py-3 text-center text-[10px] leading-relaxed text-white print:px-[18mm]" style={{ backgroundColor: settings?.primaryColor }}>
        <p>
          {[settings?.phone, settings?.phone2].filter(Boolean).join(' - ')}
          {settings?.whatsapp ? ` · واتساب ${settings.whatsapp}` : ''}
          {settings?.email ? ` · ${settings.email}` : ''}
        </p>
      </footer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-neutral-500">{label}:</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
