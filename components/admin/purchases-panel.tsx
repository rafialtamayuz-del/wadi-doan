'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Notice } from '@/components/ui/fields'
import { apiSend, fileToDataUrl, useCollection } from '@/lib/client'
import { formatDate, sar } from '@/lib/format'
import type { Purchase } from '@/lib/types'

export function PurchasesPanel() {
  const { data: purchases, mutate } = useCollection<Purchase>('purchases')
  const [image, setImage] = useState('')
  const [error, setError] = useState('')
  const [formKey, setFormKey] = useState(0)

  const total = (purchases ?? []).reduce((s, p) => s + p.amount, 0)

  async function add(form: FormData) {
    setError('')
    const supplier = String(form.get('supplier') ?? '').trim()
    const amount = Number(form.get('amount'))
    if (!supplier || !(amount > 0)) return setError('أدخل اسم المورد ومبلغًا صحيحًا')
    await apiSend('/api/db/purchases', 'POST', {
      supplier,
      invoiceNo: String(form.get('invoiceNo') ?? '').trim(),
      date: String(form.get('date') ?? ''),
      amount,
      notes: String(form.get('notes') ?? '').trim(),
      image,
    })
    setImage('')
    setFormKey((k) => k + 1)
    await mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <form key={formKey} action={add} className="grid gap-3 md:grid-cols-3">
          <Field label="المورد">
            <Input name="supplier" required />
          </Field>
          <Field label="رقم الفاتورة">
            <Input name="invoiceNo" required />
          </Field>
          <Field label="التاريخ">
            <Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="المبلغ (ر.س)">
            <Input name="amount" type="number" min={0} step="0.01" required />
          </Field>
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
          {error && <Notice className="md:col-span-3">{error}</Notice>}
          <Button type="submit" size="lg" className="self-start md:col-span-3 md:w-fit">
            <Plus aria-hidden="true" />
            تسجيل الفاتورة
          </Button>
        </form>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{purchases?.length ?? 0} فاتورة مسجلة</p>
        <p className="font-semibold">الإجمالي: {sar(Math.round(total * 100) / 100)}</p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-right">
              <th className="p-3 font-semibold">المورد</th>
              <th className="p-3 font-semibold">رقم الفاتورة</th>
              <th className="p-3 font-semibold">التاريخ</th>
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
