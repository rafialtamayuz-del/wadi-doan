import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** عميل Supabase على الخادم مع تمرير جلسة المستخدم عبر الكوكيز. */
export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
          } catch {
            // لا يمكن ضبط الكوكيز من داخل Server Component؛ تحديث الجلسة يتم عبر middleware.
          }
        },
      },
    },
  )
}

/** يعيد المستخدم الحالي المسجّل دخوله أو null. */
export async function getCurrentUser() {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}
