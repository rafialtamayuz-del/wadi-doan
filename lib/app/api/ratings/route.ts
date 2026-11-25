import { createRating } from '@/lib/data'

/** حفظ تقييم العميل للخدمة بعد إتمام الدفع الإلكتروني لطلب الطاولة (بدون تسجيل دخول). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    orderId?: string
    table?: string
    rating?: unknown
    comment?: string
    customer?: string
  }
  const rating = Number(body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: 'التقييم غير صالح' }, { status: 400 })
  }
  try {
    await createRating({
      orderId: body.orderId || undefined,
      table: body.table || undefined,
      rating,
      comment: body.comment,
      customer: body.customer,
    })
    return Response.json({ ok: true }, { status: 201 })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
