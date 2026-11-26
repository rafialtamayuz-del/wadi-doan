'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Notice } from '@/components/ui/fields'
import { apiSend, fileToDataUrl, useCollection } from '@/lib/client'
import { formatDate, round2, sar } from '@/lib/format'
import type { Purchase, PurchaseLine } from '@/lib/types'

const blankLine = (): PurchaseLine => ({ name: '', qty: 1, price: 0, group: '' })

export function PurchasesPanel() {
  const { data: purchases, mutate } = useCollection<Purchase>('purchases')
  const [image, setImage] = useState('')
  const [lines, setLines] = useState<PurchaseLine[]>([blankLine()])
  const [error, setError] = useState('')
  const [formKey, setFormKey] = useState(0)

  const total = (purchases ?? []).reduce((s, p) => s + p.amount, 0)
  // الإجمالي يُحسب تلقائيًا من مجموع (الكمية × السعر) لكل سطر.
  const linesTotal = round2(lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0))

  function updateLine(index: number, patch: Partial<PurchaseLine>) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  async function add(form: FormData) {
    setError('')
    const supplier = String(form.get('supplier') ?? '').trim()
    const validLines = lines.filter((l) => l.name.trim() && Number(l.qty) > 0)
    if (!supplier || validLines.length === 0 || !(linesTotal > 0)) {
      return setError('أدخل اسم المورد وسطرًا واحدًا على الأقل بالصنف والكمية والسعر')
    }
    await apiSend('/api/db/purchases', 'POST', {
      supplier,
      invoiceNo: String(form.get('invoiceNo') ?? '').trim(),
      date: String(form.get('date') ?? ''),
      amount: linesTotal,
      lines: validLines.map((l) => ({
        name: l.name.trim(),
        qty: Number(l.qty),
        price: Number(l.price),
        group: l.group.trim(),
      })),
      notes: String(form.get('notes') ?? '').trim(),
      image,
    })
    setImage('')
    setLines([blankLine()])
    setFormKey((k) => k + 1)
    await mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <form key={formKey} action={add} className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="المورد">
              <Input name="supplier" required />
            </Field>
            <Field label="رقم الفاتورة">
              <Input name="invoiceNo" required />
            </Field>
            <Field label="التاريخ">
              <Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">تفريغ أصناف الفاتورة</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setLines((ls) => [...ls, blankLine()])}>
                <Plus aria-hidden="true" />
                إضافة سطر
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-right text-xs text-muted-foreground">
                    <th className="p-1.5 font-medium">الصنف</th>
                    <th className="p-1.5 font-medium">الكمية</th>
                    <th className="p-1.5 font-medium">السعر</th>
                    <th className="p-1.5 font-medium">المجموعة</th>
                    <th className="p-1.5 font-medium">المجموع</th>
                    <th className="p-1.5">
                      <span className="sr-only">حذف</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="p-1.5">
                        <Input
                          aria-label="الصنف"
                          value={l.name}
                          onChange={(e) => updateLine(i, { name: e.target.value })}
                          placeholder="اسم الصنف"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          aria-label="الكمية"
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-24"
                          value={l.qty}
                          onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          aria-label="السعر"
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-28"
                          value={l.price}
                          onChange={(e) => updateLine(i, { price: Number(e.target.value) })}
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          aria-label="المجموعة"
                          value={l.group}
                          onChange={(e) => updateLine(i, { group: e.target.value })}
                          placeholder="مثال: لحوم"
                        />
                      </td>
                      <td className="p-1.5 whitespace-nowrap font-medium">
                        {sar(round2((Number(l.qty) || 0) * (Number(l.price) || 0)))}
                      </td>
                      <td className="p-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`حذف السطر ${i + 1}`}
                          disabled={lines.length === 1}
                          onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="p-1.5 text-left font-semibold">
                      الإجمالي التلقائي
                    </td>
                    <td className="p-1.5 font-bold">{sar(linesTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Field label="ملاحظات">
              <Input name="notes" />
            </Field>
            <Field label="صورة الفاتورة" hint="حتى 3 ميجابايت">
              <Input
                type="file"
                accept="image/*,application/pdf"
                className="py-1.5"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  try {
                    setImage(await fileToDataUrl(f, 3))
                  } catch (err) {
                    setError((err as Error).message)
                  }
                }}
              />
            </Field>
          </div>

          {error && <Notice>{error}</Notice>}
          <Button type="submit" size="lg" className="self-start">
            <Plus aria-hidden="true" />
            تسجيل الفاتورة
          </Button>
        </form>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{purchases?.length ?? 0} فاتورة مسجلة</p>
        <p className="font-semibold">الإجمالي: {sar(round2(total))}</p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-right">
              <th className="p-3 font-semibold">المورد</th>
              <th className="p-3 font-semibold">رقم الفاتورة</th>
              <th className="p-3 font-semibold">التاريخ</th>
              <th className="p-3 font-semibold">الأصناف</th>
              <th className="p-3 font-semibold">المبلغ</th>
              <th className="p-3 font-semibold">الصورة</th>
              <th className="p-3">
                <span className="sr-only">حذف</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {purchases?.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3 font-medium">
                  {p.supplier}
                  {p.notes && <p className="text-xs font-normal text-muted-foreground">{p.notes}</p>}
                </td>
                <td className="p-3">{p.invoiceNo}</td>
                <td className="p-3">{p.date ? formatDate(p.date) : '-'}</td>
                <td className="p-3">
                  {p.lines?.length ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-primary">{p.lines.length} صنف</summary>
                      <ul className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
                        {p.lines.map((l, i) => (
                          <li key={i}>
                            {l.name} — {l.qty} × {sar(l.price)}
                            {l.group ? ` · ${l.group}` : ''}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3">{sar(p.amount)}</td>
                <td className="p-3">
                  {p.image ? (
                    <a href={p.image} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      عرض
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`حذف فاتورة ${p.supplier}`}
                    onClick={async () => {
                      if (!confirm('حذف الفاتورة؟')) return
                      await apiSend(`/api/db/purchases/${p.id}`, 'DELETE')
                      await mutate()
                    }}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
