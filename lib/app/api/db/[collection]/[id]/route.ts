import { deleteRecord, updateRecord } from '@/lib/data'
import { getCurrentUser } from '@/lib/supabase/server'
import { isCollection } from '@/lib/types'

type Ctx = { params: Promise<{ collection: string; id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const { collection, id } = await params
  if (!isCollection(collection)) return Response.json({ error: 'غير موجود' }, { status: 404 })
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  const { id: _id, createdAt: _c, ...patch } = (await req.json()) as Record<string, unknown>
  try {
    return Response.json(await updateRecord(collection, id, patch))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { collection, id } = await params
  if (!isCollection(collection)) return Response.json({ error: 'غير موجود' }, { status: 404 })
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  try {
    await deleteRecord(collection, id)
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
