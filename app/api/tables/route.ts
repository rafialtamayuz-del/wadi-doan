import { payTableOrder, setTableStatus } from '@/lib/data'

/**
 * إدارة طاولات المطعم عبر باركود الطاولة (بدون تسجيل دخول):
 * - open: تعليم الطاولة مشغولة عند فتح العميل للمنيو.
 * - close: تعليم الطاولة متاحة.
 * - pay: إتمام الدفع الإلكتروني وإغلاق الطاولة تلقائيًا.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; table?: unknown; orderId?: unknown }
  const tableNo = Number(body.table)
  if (!Number.isInteger(tableNo) || tableNo <= 0) {
    return Response.json({ error: 'رقم الطاولة غير صالح' }, { status: 400 })
  }

  try {
    if (body.action === 'open') {
      await setTableStatus(tableNo, 'open')
      return Response.json({ ok: true, table: tableNo, status: 'open' })
    }
    if (body.action === 'close') {
      await setTableStatus(tableNo, 'closed')
      return Response.json({ ok: true, table: tableNo, status: 'closed' })
    }
    if (body.action === 'pay') {
      const orderId = String(body.orderId ?? '')
      if (!orderId) return Response.json({ error: 'معرّف الطلب مطلوب' }, { status: 400 })
      const order = await payTableOrder(orderId, String(tableNo))
      if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
      return Response.json(order)
    }
    return Response.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
