import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { MessageCircle, Smartphone } from 'lucide-react'
import { getOrder, getSettings } from '@/lib/data'
import { formatDateTime, sar, toInternationalPhone, zatcaQrBase64 } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_TYPES, PAYMENT_METHODS } from '@/lib/types'
import { SiteHeader } from '@/components/site-header'
import { buttonVariants } from '@/components/ui/button'
import { QrBlock } from '@/components/invoice/qr-block'
import { PrintButton } from '@/components/print-button'

export const metadata: Metadata = { title: 'فاتورة ضريبية مبسطة', robots: { index: false } }

const PAYMENT_STATUS = { paid: 'مدفوع', pending: 'الدفع عند الاستلام', review: 'بانتظار مراجعة التحويل' }

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()
  const s = await getSettings()
  const qr = zatcaQrBase64({ seller: s.name, vatNumber: s.vatNumber, timestamp: order.createdAt, total: order.total, vat: order.vat })
  const net = order.total - order.vat

  // رسالة الفاتورة وكود الاستلام لإرسالها لجوال العميل عبر واتساب أو SMS.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const invoiceUrl = host ? `${proto}://${host}/invoice/${order.id}` : `/invoice/${order.id}`
  const waPhone = toInternationalPhone(order.phone)
  const message = [
    `${s.name} - فاتورة ضريبية مبسطة رقم INV-${order.number}`,
    `الإجمالي شامل الضريبة: ${sar(order.total)}`,
    order.pickupCode ? `كود الاستلام: ${order.pickupCode}` : '',
    `رابط الفاتورة: ${invoiceUrl}`,
  ]
    .filter(Boolean)
    .join('\n')
  const waHref = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
  const smsHref = `sms:${waPhone}?body=${encodeURIComponent(message)}`

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 print:p-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="rounded-lg bg-emerald-600/10 px-3 py-2 text-sm font-medium text-emerald-700">
            تم استلام طلبك رقم #{order.number} بنجاح - الحالة: {ORDER_STATUS_LABEL[order.status]}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/restaurant" className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">
              طلب جديد
            </Link>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
              <MessageCircle aria-hidden="true" />
              إرسال الفاتورة وكود الاستلام واتساب
            </a>
            <a href={smsHref} className={buttonVariants({ variant: 'outline' })}>
              <Smartphone aria-hidden="true" />
              إرسال SMS
            </a>
            <PrintButton label="طباعة الفاتورة" />
          </div>
        </div>

        <article className="flex flex-col gap-6 rounded-2xl border bg-card p-6 print:rounded-none print:border-0">
          <header className="flex items-start justify-between gap-4 border-b pb-5">
            <div className="flex items-center gap-3">
              <img src={s.logo} alt="" className="size-16 rounded-full border object-cover" />
              <div>
                <p className="font-heading text-lg font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.city} - {s.district}
                </p>
                <p className="text-xs text-muted-foreground">الرقم الضريبي: {s.vatNumber}</p>
                <p className="text-xs text-muted-foreground">السجل التجاري: {s.crNumber}</p>
              </div>
            </div>
            <div className="text-left">
              <h1 className="font-heading text-xl font-bold">فاتورة ضريبية مبسطة</h1>
              <p className="text-xs text-muted-foreground">Simplified Tax Invoice</p>
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row label="رقم الفاتورة" value={`INV-${order.number}`} />
            <Row label="التاريخ" value={formatDateTime(order.createdAt)} />
            <Row label="العميل" value={order.customerName} />
            <Row label="الجوال" value={order.phone} />
            <Row label="نوع الطلب" value={ORDER_TYPES.find((t) => t.id === order.type)?.label ?? ''} />
            {order.table && <Row label="الطاولة" value={order.table} />}
            {order.zoneName && <Row label="حي التوصيل" value={order.zoneName} />}
            {order.scheduledAt && <Row label="موعد الحجز" value={formatDateTime(order.scheduledAt)} />}
            <Row label="طريقة الدفع" value={PAYMENT_METHODS.find((p) => p.id === order.payment.method)?.label ?? ''} />
            <Row label="حالة الدفع" value={PAYMENT_STATUS[order.payment.status]} />
          </dl>

          {order.pickupCode && (
            <section
              aria-label="كود الاستلام الأمني"
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-primary bg-primary/5 p-4 text-center"
            >
              <p className="text-sm font-semibold text-primary">كود الاستلام الأمني</p>
              <p dir="ltr" className="font-heading text-4xl font-bold tracking-[0.4em] text-primary">
                {order.pickupCode}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                أظهر هذا الكود لمندوب التوصيل أو موظف الاستلام عند تسليم طلبك المدفوع إلكترونيًا. لا تشاركه مع أي شخص آخر.
              </p>
            </section>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/60 text-right">
                <th className="p-2 font-semibold">الصنف</th>
                <th className="p-2 font-semibold">الكمية</th>
                <th className="p-2 font-semibold">السعر</th>
                <th className="p-2 text-left font-semibold">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={`${l.itemId}-${l.options ?? ''}`} className="border-b">
                  <td className="p-2">
                    {l.name}
                    {l.options && <span className="block text-xs text-muted-foreground">{l.options}</span>}
                  </td>
                  <td className="p-2">{l.qty}</td>
                  <td className="p-2">{sar(l.unitPrice)}</td>
                  <td className="p-2 text-left">{sar(l.unitPrice * l.qty)}</td>
                </tr>
              ))}
              {order.deliveryFee > 0 && (
                <tr className="border-b">
                  <td className="p-2" colSpan={3}>
                    رسوم التوصيل
                  </td>
                  <td className="p-2 text-left">{sar(order.deliveryFee)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex flex-col-reverse items-center gap-6 sm:flex-row sm:items-end sm:justify-between">
            <QrBlock value={qr} />
            <dl className="flex w-full max-w-64 flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">المبلغ قبل الضريبة</dt>
                <dd>{sar(Math.round(net * 100) / 100)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ضريبة القيمة المضافة 15%</dt>
                <dd>{sar(order.vat)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <dt>الإجمالي</dt>
                <dd>{sar(order.total)}</dd>
              </div>
            </dl>
          </div>
          <p className="border-t pt-4 text-center text-xs text-muted-foreground">
            شكرًا لاختياركم {s.name} - {s.phone}
          </p>
        </article>
      </main>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
