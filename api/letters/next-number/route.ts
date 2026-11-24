import { peekNextLetterNumber } from '@/lib/data'
import { getCurrentUser } from '@/lib/supabase/server'

/** يعيد رقم الخطاب التالي المتوقع (دون حجزه) لمعاينته في المحرر قبل الحفظ. */
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  const date = new URL(req.url).searchParams.get('date') ?? undefined
  try {
    return Response.json({ number: await peekNextLetterNumber(date) })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
