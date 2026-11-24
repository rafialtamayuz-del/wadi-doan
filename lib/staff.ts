import type { User } from '@supabase/supabase-js'
import { normalizePermissions } from './permissions'
import { isStaffRole, normalizeUsername, roleFromUser } from './roles'
import { getCurrentUser } from './supabase/server'
import type { StaffAccount, StaffAccountRole } from './types'

/** يتحقق أن المستخدم الحالي صاحب المشروع، وإلا يعيد استجابة خطأ جاهزة. */
export async function requireOwner(): Promise<{ error: Response } | { user: User }> {
  const user = await getCurrentUser()
  if (!user) return { error: Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 }) }
  if (roleFromUser(user) !== 'owner') {
    return { error: Response.json({ error: 'هذه الصفحة مخصّصة لصاحب المشروع' }, { status: 403 }) }
  }
  return { user }
}

/** يتحقق من صحة اسم المستخدم (رقم جوال سعودي أو هوية وطنية) ويعيد صيغته القياسية. */
export function validUsername(raw: string): string | null {
  const value = normalizeUsername(raw)
  if (/^5\d{8}$/.test(value)) return value // جوال سعودي (9 خانات)
  if (/^[12]\d{9}$/.test(value)) return value // رقم الهوية الوطنية (10 خانات)
  return null
}

/** كلمة المرور: 8 خانات على الأقل وتجمع بين حروف وأرقام. */
export function validPassword(value: string): boolean {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
}

/** يحوّل حساب Supabase Auth إلى حساب موظف معروض في اللوحة. */
export function toStaffAccount(u: User): StaffAccount {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  const role = isStaffRole(meta.role) ? (meta.role as StaffAccountRole) : 'staff'
  const email = u.email ?? ''
  return {
    id: u.id,
    email,
    fullName: String(meta.full_name ?? '').trim(),
    username: String(meta.username ?? email.split('@')[0] ?? ''),
    phone: String(meta.phone ?? ''),
    role,
    permissions: normalizePermissions(meta.permissions),
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? undefined,
  }
}
