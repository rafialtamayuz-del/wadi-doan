import { normalizePermissions } from '@/lib/permissions'
import { usernameToEmail } from '@/lib/roles'
import { requireOwner, toStaffAccount, validPassword, validUsername } from '@/lib/staff'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { STAFF_ACCOUNT_ROLES, type StaffAccountRole } from '@/lib/types'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const guard = await requireOwner()
  if ('error' in guard) return guard.error
  const { id } = await params
  const body = (await req.json()) as Record<string, unknown>

  try {
    const admin = supabaseAdmin()
    const { data: existing, error: readError } = await admin.auth.admin.getUserById(id)
    if (readError || !existing?.user) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 })

    const meta: Record<string, unknown> = { ...(existing.user.user_metadata ?? {}) }
    if (body.fullName !== undefined) {
      const fullName = String(body.fullName).trim()
      if (fullName.length < 2) return Response.json({ error: 'الاسم الكامل مطلوب' }, { status: 400 })
      meta.full_name = fullName
    }
    if (body.phone !== undefined) meta.phone = String(body.phone).trim()
    if (body.role !== undefined) {
      if (!STAFF_ACCOUNT_ROLES.some((r) => r.id === body.role)) {
        return Response.json({ error: 'الدور غير صحيح' }, { status: 400 })
      }
      meta.role = body.role as StaffAccountRole
    }
    if (body.permissions !== undefined) meta.permissions = normalizePermissions(body.permissions)

    const update: {
      user_metadata: Record<string, unknown>
      email?: string
      email_confirm?: boolean
      password?: string
    } = { user_metadata: meta }

    if (body.username !== undefined) {
      const username = validUsername(String(body.username))
      if (!username) {
        return Response.json({ error: 'اسم المستخدم يجب أن يكون رقم جوال سعودي أو رقم هوية وطنية' }, { status: 400 })
      }
      meta.username = username
      update.email = usernameToEmail(username)
      update.email_confirm = true
    }

    if (body.password !== undefined && String(body.password) !== '') {
      const password = String(body.password)
      if (!validPassword(password)) {
        return Response.json({ error: 'كلمة المرور يجب أن تتكون من 8 خانات على الأقل وتجمع بين حروف وأرقام' }, { status: 400 })
      }
      update.password = password
    }

    const { data, error } = await admin.auth.admin.updateUserById(id, update)
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(toStaffAccount(data.user))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const guard = await requireOwner()
  if ('error' in guard) return guard.error
  const { id } = await params
  if (id === guard.user.id) return Response.json({ error: 'لا يمكن حذف حسابك الحالي' }, { status: 400 })
  try {
    const admin = supabaseAdmin()
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
