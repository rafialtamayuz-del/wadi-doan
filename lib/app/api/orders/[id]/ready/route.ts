import { markOrderReady } from '@/lib/data'

type Ctx = { params: Promise<{ id: string }> }

/**
 * تحديث حالة الطلب إلى «جاهز للتسليم» عند مسح باركود بون المطبخ من متصفح جوال الطاقم (بدون تسجيل دخول).
 */
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params
  try {
    const order = await markOrderReady(id)
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
    return Response.json(order)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
