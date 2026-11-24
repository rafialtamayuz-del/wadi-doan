import { createClient } from '@supabase/supabase-js'

/**
 * عميل Supabase بمفتاح الخدمة (Service Role) لعمليات إدارة الحسابات (إنشاء/تعديل/حذف موظفين).
 * يتطلب وجود SUPABASE_SERVICE_ROLE_KEY في متغيرات البيئة على الخادم فقط، ولا يُستخدم في الواجهة.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('إدارة الحسابات غير مُهيّأة: يجب ضبط SUPABASE_SERVICE_ROLE_KEY في متغيرات البيئة على الخادم.')
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
