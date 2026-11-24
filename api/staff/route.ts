import { normalizePermissions } from '@/lib/permissions'
import { usernameToEmail } from '@/lib/roles'
import { requireOwner, toStaffAccount, validPassword, validUsername } from '@/lib/staff'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { STAFF_ACCOUNT_ROLES, type StaffAccountRole } from '@/lib/types'

export async function GET() {
  const guard = await requireOwner()
  if ('error' in guard) return guard.error
  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data.users.map(toStaffAccount))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const guard = await requireOwner()
  if ('error' in guard) return guard.error
  const body = (await req.json()) as Record<string, unknown>

  const fullName = String(body.fullName ?? '').trim()
  if (fullName.length < 2) return Response.json({ error: 'الاسم الكامل مطلوب' }, { status: 400 })

  const username = validUsername(String(body.username ?? ''))
  if (!username) {
    return Response.json({ error: 'اسم المستخدم يجب أن يكون رقم جوال سعودي أو رقم هوية وطنية' }, { status: 400 })
  }

  const password = String(body.password ?? '')
  if (!validPassword(password)) {
    return Response.json({ error: 'كلمة المرور يجب أن تتكون من 8 خانات على الأقل وتجمع بين حروف وأرقام' }, { status: 400 })
  }

  const role: StaffAccountRole = STAFF_ACCOUNT_ROLES.some((r) => r.id === body.role)
    ? (body.role as StaffAccountRole)
    : 'staff'

  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin.auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username,
        phone: String(body.phone ?? username).trim(),
        role,
        permissions: normalizePermissions(body.permissions),
      },
    })
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(toStaffAccount(data.user), { status: 201 })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
