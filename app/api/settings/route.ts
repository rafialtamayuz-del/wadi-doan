import { getSettings, saveSettings } from '@/lib/data'
import { getCurrentUser } from '@/lib/supabase/server'
import type { Settings } from '@/lib/types'

export async function GET() {
  try {
    return Response.json(await getSettings())
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  const body = (await req.json()) as Partial<Settings>
  if (body.name !== undefined && !String(body.name).trim()) {
    return Response.json({ error: 'اسم النشاط مطلوب' }, { status: 400 })
  }
  try {
    return Response.json(await saveSettings(body))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
