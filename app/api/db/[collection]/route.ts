import { createRecord, listRecords } from '@/lib/data'
import { getCurrentUser } from '@/lib/supabase/server'
import { isCollection, type CollectionName } from '@/lib/types'

type Ctx = { params: Promise<{ collection: string }> }

/** مجموعات لا يجوز للعملاء قراءتها؛ تتطلب تسجيل دخول صاحب المشروع. */
const ADMIN_ONLY_READ: CollectionName[] = ['purchases', 'letters', 'complaints', 'reports', 'invoices']

export async function GET(_req: Request, { params }: Ctx) {
  const { collection } = await params
  if (!isCollection(collection)) return Response.json({ error: 'غير موجود' }, { status: 404 })
  if (ADMIN_ONLY_READ.includes(collection)) {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  }
  try {
    return Response.json(await listRecords(collection))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const { collection } = await params
  if (!isCollection(collection)) return Response.json({ error: 'غير موجود' }, { status: 404 })
  const body = (await req.json()) as Record<string, unknown>

  try {
    // الشكاوى يمكن للعملاء إرسالها بدون تسجيل دخول.
    if (collection === 'complaints') {
      const name = String(body.name ?? '').trim().slice(0, 80)
      const phone = String(body.phone ?? '').trim().slice(0, 20)
      const message = String(body.message ?? '').trim().slice(0, 2000)
      if (name.length < 2 || !/^[+0-9\s]{9,15}$/.test(phone) || message.length < 5) {
        return Response.json({ error: 'يرجى إدخال الاسم ورقم جوال صحيح ونص الشكوى' }, { status: 400 })
      }
      const record = await createRecord('complaints', {
        name,
        phone,
        message,
        orderNumber: String(body.orderNumber ?? '').trim().slice(0, 12),
        reply: '',
        status: 'open',
      })
      return Response.json(record, { status: 201 })
    }

    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    const { id: _id, createdAt: _c, ...rest } = body
    const record = await createRecord(collection, rest)
    return Response.json(record, { status: 201 })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
