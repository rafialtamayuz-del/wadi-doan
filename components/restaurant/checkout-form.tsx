'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, MapPin } from 'lucide-react'
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

/** صيغة العنوان الوطني المختصر: 4 حروف + 4 أرقام (مثال: RRRD2929). */
const SHORT_ADDRESS_RE = /^[A-Za-z]{4}\d{4}$/

/** نتيجة تعبئة العنوان التلقائية من خدمة خرائط جوجل. */
type GeoResult = {
  city: string
  district: string
  street: string
  postalCode: string
  lat?: number
  lng?: number
  /** العنوان المختصر الذي عُبِّئت منه الخانات (لتجنّب إعادة الطلب نفسه). */
  shortAddressFor?: string
}
const EMPTY_GEO: GeoResult = { city: '', district: '', street: '', postalCode: '' }

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
  const [shortAddress, setShortAddress] = useState('')
  const [geo, setGeo] = useState<GeoResult>(EMPTY_GEO)
  const [autoFilled, setAutoFilled] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [detail, setDetail] = useState('')
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

  /** يجلب بيانات العنوان من خرائط جوجل عبر العنوان الوطني المختصر ويعبّئ خانات العنوان تلقائيًا. */
  async function lookup(force = false) {
    const short = shortAddress.trim().toUpperCase()
    if (!short) return
    if (!SHORT_ADDRESS_RE.test(short)) {
      setGeoError('صيغة العنوان الوطني المختصر غير صحيحة (4 حروف و4 أرقام، مثال: RRRD2929)')
      return
    }
    if (!force && short === geo.shortAddressFor) return
    setGeoLoading(true)
    setGeoError('')
    try {
      const res = await fetch(`/api/geocode?short=${encodeURIComponent(short)}`)
      const data = (await res.json().catch(() => ({}))) as Partial<GeoResult> & { error?: string; shortAddressFor?: string }
      if (!res.ok) throw new Error(data.error || 'تعذّر تحديد الموقع')
      setGeo({
        city: data.city ?? '',
        district: data.district ?? '',
        street: data.street ?? '',
        postalCode: data.postalCode ?? '',
        lat: data.lat,
        lng: data.lng,
        shortAddressFor: short,
      })
      setAutoFilled(true)
    } catch (e) {
      setGeoError((e as Error).message)
    } finally {
      setGeoLoading(false)
    }
  }

  const mapSrc =
    geo.lat !== undefined && geo.lng !== undefined
      ? `https://maps.google.com/maps?q=${geo.lat},${geo.lng}&hl=ar&z=15&output=embed`
      : ''

  async function submit(form: FormData) {
    setError('')
    if (!method) return setError('يرجى اختيار طريقة الدفع')
    setSubmitting(true)
    try {
      // العنوان المحفوظ يُبنى من تفاصيل العنوان الكاملة المعبّأة من خرائط جوجل (قابل للتعديل يدويًا).
      const composed = [detail, geo.street, geo.district, geo.city].map((v) => v.trim()).filter(Boolean).join('، ')
      const address = composed.length >= 5 ? composed : shortAddress.trim().toUpperCase()
      const order = await apiSend<Order>('/api/orders', 'POST', {
        type,
        table: form.get('table'),
        zoneId,
        address: type === 'delivery' ? address : undefined,
        shortAddress: type === 'delivery' ? shortAddress.trim().toUpperCase() : undefined,
        lat: type === 'delivery' ? geo.lat : undefined,
        lng: type === 'delivery' ? geo.lng : undefined,
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
      // طلب الطاولة المدفوع إلكترونيًا: يُغلق الطاولة تلقائيًا ويعرض شاشة تقييم الخدمة للعميل.
      if (table && ELECTRONIC.includes(method as PaymentMethod)) {
        try {
          await apiSend('/api/tables', 'POST', { action: 'pay', table: Number(table), orderId: order.id })
        } catch {
          // نتجاهل تعذّر إغلاق الطاولة ونكمل إلى شاشة التقييم.
        }
        router.push(`/rating?order=${order.id}&table=${table}`)
      } else {
        router.push(`/invoice/${order.id}`)
      }
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

          <Field label="العنوان الوطني المختصر" hint="4 حروف و4 أرقام، مثال: RRRD2929">
            <div className="flex gap-2">
              <Input
                dir="ltr"
                value={shortAddress}
                onChange={(e) => {
                  setShortAddress(e.target.value.toUpperCase().slice(0, 8))
                  setAutoFilled(false)
                }}
                onBlur={() => lookup()}
                placeholder="RRRD2929"
                maxLength={8}
                autoCapitalize="characters"
                className="flex-1 font-mono tracking-widest"
                required
              />
              <Button type="button" variant="outline" disabled={geoLoading} onClick={() => lookup(true)}>
                {geoLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MapPin aria-hidden="true" />}
                تحديد الموقع
              </Button>
            </div>
          </Field>

          {geoError && <Notice>{geoError}</Notice>}
          {autoFilled && !geoError && (
            <p className="rounded-lg bg-accent/20 px-3 py-2 text-xs leading-relaxed">
              تم تعبئة تفاصيل العنوان تلقائيًا من خرائط جوجل، ويمكنك تعديلها عند الحاجة.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="المدينة">
              <Input value={geo.city} onChange={(e) => setGeo({ ...geo, city: e.target.value })} placeholder="تلقائي من الخريطة" />
            </Field>
            <Field label="الحي">
              <Input value={geo.district} onChange={(e) => setGeo({ ...geo, district: e.target.value })} placeholder="تلقائي من الخريطة" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الشارع">
              <Input value={geo.street} onChange={(e) => setGeo({ ...geo, street: e.target.value })} placeholder="تلقائي من الخريطة" />
            </Field>
            <Field label="الرمز البريدي">
              <Input
                dir="ltr"
                value={geo.postalCode}
                onChange={(e) => setGeo({ ...geo, postalCode: e.target.value })}
                placeholder="تلقائي من الخريطة"
              />
            </Field>
          </div>

          {mapSrc && (
            <div className="overflow-hidden rounded-xl border">
              <iframe title="خريطة موقع التوصيل" src={mapSrc} className="aspect-[16/9] w-full" loading="lazy" />
            </div>
          )}

          <Field label="تفاصيل إضافية" hint="رقم المبنى، الدور، أقرب معلم (اختياري)">
            <Textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={200} className="min-h-16" />
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
        <Field label={type === 'dinein' ? 'الاسم (اختياري)' : 'الاسم'}>
          <Input name="customerName" required={type !== 'dinein'} minLength={2} autoComplete="name" />
        </Field>
        <Field label={type === 'dinein' ? 'رقم الجوال (اختياري)' : 'رقم الجوال'}>
          <Input
            name="phone"
            required={type !== 'dinein'}
            type="tel"
            dir="ltr"
            placeholder="05xxxxxxxx"
            pattern="[+0-9\s]{9,15}"
            autoComplete="tel"
          />
        </Field>
      </div>
      {type === 'dinein' && (
        <p className="rounded-lg bg-accent/20 px-3 py-2 text-xs leading-relaxed">
          {table
            ? 'طلب من طاولة: إدخال الاسم ورقم الجوال اختياري. عند الدفع الإلكتروني تُغلق الطاولة تلقائيًا وتظهر لك شاشة تقييم الخدمة.'
            : 'الطلب المحلي داخل المطعم: إدخال الاسم ورقم الجوال اختياري، ويتم الدفع عند المحاسبة.'}
        </p>
      )}

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
