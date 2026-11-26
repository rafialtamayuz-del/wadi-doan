import { createRating, markOrderReady, payTableOrder, setTableStatus } from '@/lib/data'

/**
 * مسار إجراءات موحّد للعمليات التي لا تحتاج تسجيل دخول:
 * - table-open / table-close: حالة طاولة المطعم عبر باركود الطاولة.
 * - table-pay: الدفع الإلكتروني وإغلاق الطاولة تلقائيًا.
 * - rate: حفظ تقييم العميل للخدمة.
 * - order-ready: تحديث حالة الطلب إلى «جاهز» بعد مسح باركود بون المطبخ.
 * دُمجت في مسار واحد للحفاظ على عدد مسارات API أقل من الحد المسموح في باقة Vercel المجانية.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string
    table?: unknown
    orderId?: string
    rating?: unknown
    comment?: string
    customer?: string
  }

  const tableNo = Number(body.table)

  try {
    switch (body.action) {
      case 'table-open':
      case 'table-close': {
        if (!Number.isInteger(tableNo) || tableNo <= 0) {
          return Response.json({ error: 'رقم الطاولة غير صالح' }, { status: 400 })
        }
        const status = body.action === 'table-open' ? 'open' : 'closed'
        await setTableStatus(tableNo, status)
        return Response.json({ ok: true, table: tableNo, status })
      }
      case 'table-pay': {
        if (!Number.isInteger(tableNo) || tableNo <= 0) {
          return Response.json({ error: 'رقم الطاولة غير صالح' }, { status: 400 })
        }
        const orderId = String(body.orderId ?? '')
        if (!orderId) return Response.json({ error: 'معرّف الطلب مطلوب' }, { status: 400 })
        const order = await payTableOrder(orderId, String(tableNo))
        if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
        return Response.json(order)
      }
      case 'rate': {
        const rating = Number(body.rating)
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          return Response.json({ error: 'التقييم غير صالح' }, { status: 400 })
        }
        const table = body.table === undefined || body.table === null ? undefined : String(body.table)
        await createRating({
          orderId: body.orderId || undefined,
          table: table || undefined,
          rating,
          comment: body.comment,
          customer: body.customer,
        })
        return Response.json({ ok: true }, { status: 201 })
      }
      case 'order-ready': {
        const id = String(body.orderId ?? '')
        if (!id) return Response.json({ error: 'معرّف الطلب مطلوب' }, { status: 400 })
        const order = await markOrderReady(id)
        if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
        return Response.json(order)
      }
      default:
        return Response.json({ error: 'إجراء غير معروف' }, { status: 400 })
    }
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
