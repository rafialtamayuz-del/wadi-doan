'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Notice, Select, Textarea } from '@/components/ui/fields'
import { apiSend, fileToDataUrl, useCollection, useSettings } from '@/lib/client'
import { sar } from '@/lib/format'
import {
  ORDER_TYPES,
  PAYMENT_METHODS,
  type BankAccount,
  type MenuItem,
  type Order,
  type OrderType,
  type PaymentMethod,
  type Zone,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const ELECTRONIC: PaymentMethod[] = ['mada', 'applepay', 'visa', 'tabby', 'tamara']

export function CheckoutForm({
  lines,
  subtotal,
  isBooking,
  table,
  onBack,
  onDone,
}: {
  lines: { item: MenuItem; qty: number; options?: string }[]
  subtotal: number
  isBooking: boolean
  table: string
  onBack: () => void
  onDone: () => void
}) {
  const router = useRouter()
  const { data: settings } = useSettings()
  const { data: zones } = useCollection<Zone>('zones')
  const { data: accounts } = useCollection<BankAccount>('accounts')
  const [type, setType] = useState<OrderType>(table ? 'dinein' : isBooking ? 'pickup' : 'takeaway')
  const [zoneId, setZoneId] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [receipt, setReceipt] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const zone = zones?.find((z) => z.id === zoneId)
  const deliveryFee = type === 'delivery' && zone ? zone.fee : 0
  const total = subtotal + deliveryFee
  const enabledMethods = PAYMENT_METHODS.filter((p) => settings?.gateways[p.id])
  const activeAccounts = accounts?.filter((a) => a.active) ?? []

  async function handleReceipt(file?: File) {
    if (!file) return
    try {
      setReceipt(await fileToDataUrl(file, 3))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function submit(form: FormData) {
    setError('')
    if (!method) return setError('يرجى اختيار طريقة الدفع')
    setSubmitting(true)
    try {
      const order = await apiSend<Order>('/api/orders', 'POST', {
        type,
        table: form.get('table'),
        zoneId,
        address: form.get('address'),
        pickupFrom: form.get('pickupFrom'),
        customerName: form.get('customerName'),
        phone: form.get('phone'),
        scheduledAt: form.get('scheduledAt') || undefined,
        guests: form.get('guests'),
        notes: form.get('notes'),
        lines: lines.map((l) => ({ itemId: l.item.id, qty: l.qty, options: l.options })),
        payment: { method, receipt: method === 'bank' ? receipt : undefined },
      })
      onDone()
      router.push(`/invoice/${order.id}`)
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="size-4" aria-hidden="true" />
        العودة للسلة
      </button>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">نوع الطلب</legend>
        <div className="grid grid-cols-2 gap-2">
          {ORDER_TYPES.map((t) => (
            <label
              key={t.id}
              className={cn(
                'cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30',
                type === t.id ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted',
              )}
            >
              <input type="radio" name="type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {type === 'dinein' && (
        <Field label="رقم الطاولة">
          <Input name="table" defaultValue={table} inputMode="numeric" required />
        </Field>
      )}
      {type === 'delivery' && (
        <>
          <Field label="حي التوصيل">
            <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
              <option value="">اختر الحي</option>
              {zones
                ?.filter((z) => z.active)
                .map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} - رسوم {sar(z.fee)}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="العنوان التفصيلي">
            <Textarea name="address" required minLength={5} placeholder="الشارع، رقم المبنى، أقرب معلم" className="min-h-16" />
          </Field>
        </>
      )}
      {type === 'pickup' && (
        <Field label="مكان الاستلام">
          <Select name="pickupFrom" defaultValue={isBooking ? 'kitchen' : 'branch'}>
            <option value="branch">الفرع الرئيسي</option>
            <option value="kitchen">المطبخ المركزي</option>
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="الاسم">
          <Input name="customerName" required minLength={2} autoComplete="name" />
        </Field>
        <Field label="رقم الجوال">
          <Input name="phone" required type="tel" dir="ltr" placeholder="05xxxxxxxx" pattern="[+0-9\s]{9,15}" autoComplete="tel" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={isBooking ? 'تاريخ ووقت الحجز' : 'موعد الاستلام (اختياري)'}>
          <Input name="scheduledAt" type="datetime-local" required={isBooking} />
        </Field>
        <Field label="عدد الأشخاص">
          <Input name="guests" type="number" min={1} max={5000} inputMode="numeric" />
        </Field>
      </div>

      <Field label="ملاحظات للمطبخ">
        <Textarea name="notes" maxLength={500} placeholder="مثال: بدون بصل، زيادة دقوس" className="min-h-16" />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">طريقة الدفع</legend>
        {enabledMethods.map((p) => (
          <label
            key={p.id}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30',
              method === p.id ? 'border-primary bg-primary/10' : 'hover:bg-muted',
            )}
          >
            <span className="flex items-center gap-2">
              <input type="radio" name="payment" value={p.id} checked={method === p.id} onChange={() => setMethod(p.id)} className="accent-[var(--primary)]" />
              <span className="font-semibold">{p.label}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {p.id === 'tabby' ? `4 دفعات × ${sar(total / 4)}` : p.id === 'tamara' ? `3 دفعات × ${sar(total / 3)}` : p.hint}
            </span>
          </label>
        ))}
      </fieldset>

      {method && ELECTRONIC.includes(method) && (
        <p className="rounded-lg bg-accent/20 px-3 py-2 text-xs leading-relaxed">
          الدفع الإلكتروني يعمل حاليًا في الوضع التجريبي، وسيتم تحويلك لبوابة الدفع الفعلية بعد ربط مفاتيح ميسر وتابي وتمارا.
        </p>
      )}

      {method === 'bank' && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3">
          <p className="text-sm font-semibold">حوّل المبلغ إلى أحد الحسابات التالية:</p>
          <ul className="flex flex-col gap-2 text-xs">
            {activeAccounts.map((a) => (
              <li key={a.id} className="rounded-md bg-card p-2">
                <p className="font-semibold">
                  {a.bank} - {a.holder}
                </p>
                <p dir="ltr" className="text-left font-mono">
                  {a.iban}
                </p>
              </li>
            ))}
          </ul>
          <Field label="صورة إيصال التحويل" hint="صورة أو PDF حتى 3 ميجابايت">
            <Input type="file" accept="image/*,application/pdf" required onChange={(e) => handleReceipt(e.target.files?.[0])} className="py-1.5" />
          </Field>
        </div>
      )}

      <dl className="flex flex-col gap-1 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">المجموع</dt>
          <dd>{sar(subtotal)}</dd>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">رسوم التوصيل</dt>
            <dd>{sar(deliveryFee)}</dd>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <dt>الإجمالي شامل الضريبة 15%</dt>
          <dd className="text-primary">{sar(total)}</dd>
        </div>
      </dl>

      {error && <Notice>{error}</Notice>}

      <Button type="submit" size="lg" className="h-11 text-base" disabled={submitting}>
        {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        تأكيد الطلب والدفع
      </Button>
    </form>
  )
}
