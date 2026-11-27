import { recordOrderSale } from '@/app/lib/accountingEngine'
import { decrementMenuStock, getMenuItems, getSettings, getZones, insertOrder, listOrders, type NewOrder } from '@/lib/data'
import { getCurrentUser } from '@/lib/supabase/server'
import { effectivePrice, round2, vatFromInclusive } from '@/lib/format'
import {
  BOOKING_CATEGORIES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  type OrderLine,
  type OrderType,
  type PaymentMethod,
} from '@/lib/types'

const MAX_QTY_PER_ITEM = 100
const MAX_UNITS_PER_ORDER = 300
const MAX_RECEIPT_CHARS = 4_000_000

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  try {
    // كود الاستلام يُعاد للموظفين ليظهر في بطاقة الطلب عند التسليم أو المحاسبة.
    return Response.json(await listOrders())
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

const fail = (error: string) => Response.json({ error }, { status: 400 })

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>

  try {
    const type = body.type as OrderType
    if (!ORDER_TYPES.some((t) => t.id === type)) return fail('نوع الطلب غير صالح')

    const customerName = String(body.customerName ?? '').trim().slice(0, 80)
    const phone = String(body.phone ?? '').trim().slice(0, 20)
    // في الطلب المحلي (داخل المطعم) يُدخل الاسم والجوال اختياريًا عند المحاسبة.
    if (type !== 'dinein') {
      if (customerName.length < 2) return fail('يرجى إدخال الاسم')
      if (!/^[+0-9\s]{9,15}$/.test(phone)) return fail('رقم الجوال غير صحيح')
    } else {
      if (customerName && customerName.length < 2) return fail('يرجى إدخال الاسم أو تركه فارغًا')
      if (phone && !/^[+0-9\s]{9,15}$/.test(phone)) return fail('رقم الجوال غير صحيح')
    }

    const rawLines = Array.isArray(body.lines)
      ? (body.lines as { itemId?: unknown; qty?: unknown; options?: unknown }[])
      : []
    // نجمع حسب (الصنف + خيارات الحجز) لتبقى أسطر الحجز المختلفة منفصلة.
    const grouped = new Map<string, { itemId: string; qty: number; options?: string }>()
    for (const line of rawLines) {
      const qty = Number(line.qty)
      if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_QTY_PER_ITEM) return fail('الكمية غير صالحة')
      const itemId = String(line.itemId)
      const options = line.options ? String(line.options).trim().slice(0, 80) : undefined
      const key = `${itemId}|${options ?? ''}`
      const existing = grouped.get(key)
      if (existing) existing.qty += qty
      else grouped.set(key, { itemId, qty, options })
    }
    if (grouped.size === 0) return fail('السلة فارغة')
    const totalUnits = [...grouped.values()].reduce((a, b) => a + b.qty, 0)
    if (totalUnits > MAX_UNITS_PER_ORDER) return fail('تجاوزت الحد الأقصى للكميات في الطلب الواحد')

    const settings = await getSettings()
    const menu = await getMenuItems()
    const zones = await getZones()

    const lines: OrderLine[] = []
    for (const { itemId, qty, options } of grouped.values()) {
      const item = menu.find((m) => m.id === itemId && m.active)
      if (!item) return fail('أحد الأصناف غير متاح حاليًا')
      if (item.stock !== null && qty > item.stock) return fail(`الكمية المتاحة من "${item.name}" هي ${item.stock} فقط`)
      lines.push({ itemId, name: item.name, unitPrice: effectivePrice(item), qty, category: item.category, options })
    }

    const isBooking = lines.some((l) => BOOKING_CATEGORIES.includes(l.category))
    let scheduledAt: string | undefined
    if (body.scheduledAt) {
      const date = new Date(String(body.scheduledAt))
      if (Number.isNaN(date.getTime())) return fail('موعد غير صالح')
      if (date.getTime() < Date.now() - 5 * 60_000) return fail('الموعد يجب أن يكون في المستقبل')
      scheduledAt = date.toISOString()
    }
    if (isBooking && !scheduledAt) return fail('يرجى تحديد تاريخ ووقت الحجز للذبائح والولائم والإعاشة')

    let deliveryFee = 0
    let zoneId: string | undefined
    let zoneName: string | undefined
    let address: string | undefined
    let shortAddress: string | undefined
    let lat: number | undefined
    let lng: number | undefined
    if (type === 'delivery') {
      const zone = zones.find((z) => z.id === body.zoneId && z.active)
      if (!zone) return fail('يرجى اختيار حي التوصيل')
      address = String(body.address ?? '').trim().slice(0, 300)
      if (address.length < 5) return fail('يرجى إدخال عنوان التوصيل')
      // العنوان الوطني المختصر (4 حروف و4 أرقام) اختياري لكنه يُتحقق منه عند إدخاله.
      shortAddress = String(body.shortAddress ?? '').trim().toUpperCase().slice(0, 10) || undefined
      if (shortAddress && !/^[A-Z]{4}\d{4}$/.test(shortAddress)) return fail('صيغة العنوان الوطني المختصر غير صحيحة')
      const latNum = Number(body.lat)
      const lngNum = Number(body.lng)
      lat = body.lat != null && body.lat !== '' && Number.isFinite(latNum) ? latNum : undefined
      lng = body.lng != null && body.lng !== '' && Number.isFinite(lngNum) ? lngNum : undefined
      deliveryFee = zone.fee
      zoneId = zone.id
      zoneName = zone.name
    }

    const method = (body.payment as { method?: PaymentMethod } | undefined)?.method
    if (!method || !PAYMENT_METHODS.some((p) => p.id === method)) return fail('يرجى اختيار طريقة الدفع')
    if (!settings.gateways[method]) return fail('طريقة الدفع غير مفعّلة حاليًا')
    let receipt: string | undefined
    if (method === 'bank') {
      receipt = String((body.payment as { receipt?: string }).receipt ?? '')
      if (!/^data:(image\/|application\/pdf)/.test(receipt) || receipt.length > MAX_RECEIPT_CHARS) {
        return fail('يرجى إرفاق صورة إيصال التحويل (حتى 3 ميجابايت)')
      }
    }

    const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0))
    const total = round2(subtotal + deliveryFee)
    const guests = Number(body.guests)
    const now = new Date().toISOString()

    const order: NewOrder = {
      type,
      table: type === 'dinein' ? String(body.table ?? '').trim().slice(0, 10) || undefined : undefined,
      zoneId,
      zoneName,
      address,
      shortAddress,
      lat,
      lng,
      pickupFrom: type === 'pickup' ? (body.pickupFrom === 'kitchen' ? 'kitchen' : 'branch') : undefined,
      customerName,
      phone,
      scheduledAt,
      guests: Number.isInteger(guests) && guests > 0 && guests < 5000 ? guests : undefined,
      notes: String(body.notes ?? '').trim().slice(0, 500) || undefined,
      lines,
      subtotal,
      deliveryFee,
      total,
      vat: vatFromInclusive(total),
      isBooking,
      priority: 'normal',
      payment: {
        method,
        status: method === 'pos' || method === 'cash' ? 'pending' : method === 'bank' ? 'review' : 'paid',
        receipt,
        installments: method === 'tabby' ? 4 : method === 'tamara' ? 3 : undefined,
      },
      status: 'new',
      history: [{ status: 'new', at: now }],
    }

    const created = await insertOrder(order)
    // تسجيل معاملة المبيعات في دفتر الأستاذ عند الدفع الإلكتروني المباشر.
    if (created.payment.status === 'paid') {
      await recordOrderSale(created).catch(() => {})
    }
    await decrementMenuStock(lines)
    return Response.json(created, { status: 201 })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
