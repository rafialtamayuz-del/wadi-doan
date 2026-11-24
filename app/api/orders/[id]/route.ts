import { getOrder, updateOrder } from '@/lib/data'
import { getCurrentUser } from '@/lib/supabase/server'
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from '@/lib/types'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  const { id } = await params
  try {
    const order = await getOrder(id)
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
    const { payment, ...rest } = order
    return Response.json({ ...rest, payment: { ...payment, receipt: undefined } })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  const { id } = await params
  const body = (await req.json()) as {
    status?: OrderStatus
    priority?: Order['priority']
    paymentStatus?: Order['payment']['status']
  }

  if (body.status && !(body.status in ORDER_STATUS_LABEL)) {
    return Response.json({ error: 'حالة الطلب غير صالحة' }, { status: 400 })
  }
  if (body.priority && body.priority !== 'normal' && body.priority !== 'urgent') {
    return Response.json({ error: 'أولوية الطلب غير صالحة' }, { status: 400 })
  }
  if (body.paymentStatus && !['paid', 'pending', 'review'].includes(body.paymentStatus)) {
    return Response.json({ error: 'حالة الدفع غير صالحة' }, { status: 400 })
  }

  try {
    const order = await updateOrder(id, {
      status: body.status,
      priority: body.priority,
      paymentStatus: body.paymentStatus,
    })
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 })
    return Response.json(order)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
