'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { KeyRound, MessageCircle, Pencil, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice, Select } from '@/components/ui/fields'
import { apiSend, fetcher, useSettings } from '@/lib/client'
import { formatDateTime, toInternationalPhone } from '@/lib/format'
import { ALL_PERMISSIONS, STAFF_PERMISSIONS, type StaffPermission } from '@/lib/permissions'
import { STAFF_ACCOUNT_ROLES, type StaffAccount, type StaffAccountRole } from '@/lib/types'

type Draft = {
  id?: string
  fullName: string
  username: string
  phone: string
  role: StaffAccountRole
  password: string
  permissions: StaffPermission[]
}

const blank = (): Draft => ({ fullName: '', username: '', phone: '', role: 'staff', password: '', permissions: [] })

/** لوحة إدارة حسابات وصلاحيات موظفي المطعم والمطبخ (لصاحب المشروع). */
export function StaffPanel() {
  const { data: settings } = useSettings()
  const { data: accounts, mutate, error: loadError } = useSWR<StaffAccount[]>('/api/staff', fetcher)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  // كلمة المرور التي أدخلها صاحب المشروع في هذه الجلسة، لإتاحة إرسالها عبر واتساب مباشرة.
  const [known, setKnown] = useState<Record<string, string>>({})

  function togglePermission(id: StaffPermission) {
    setDraft((d) =>
      d ? { ...d, permissions: d.permissions.includes(id) ? d.permissions.filter((p) => p !== id) : [...d.permissions, id] } : d,
    )
  }

  async function save() {
    if (!draft) return
    setErr('')
    setMsg('')
    try {
      let saved: StaffAccount
      if (draft.id) {
        saved = await apiSend<StaffAccount>(`/api/staff/${draft.id}`, 'PATCH', {
          fullName: draft.fullName,
          username: draft.username,
          phone: draft.phone,
          role: draft.role,
          permissions: draft.permissions,
          password: draft.password || undefined,
        })
      } else {
        saved = await apiSend<StaffAccount>('/api/staff', 'POST', {
          fullName: draft.fullName,
          username: draft.username,
          phone: draft.phone || draft.username,
          role: draft.role,
          password: draft.password,
          permissions: draft.permissions,
        })
      }
      if (draft.password) setKnown((k) => ({ ...k, [saved.id]: draft.password }))
      await mutate()
      setDraft(null)
      setMsg('تم حفظ بيانات الحساب وصلاحياته')
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function remove(account: StaffAccount) {
    if (!confirm(`حذف حساب «${account.fullName}»؟`)) return
    try {
      await apiSend(`/api/staff/${account.id}`, 'DELETE')
      await mutate()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  /** يغيّر كلمة مرور موظف مباشرة من لدى صاحب المشروع. */
  async function changePassword(account: StaffAccount) {
    const pw = prompt(`كلمة مرور جديدة للموظف «${account.fullName}» (8 خانات على الأقل وتجمع بين حروف وأرقام):`)
    if (!pw) return
    try {
      await apiSend(`/api/staff/${account.id}`, 'PATCH', { password: pw })
      setKnown((k) => ({ ...k, [account.id]: pw }))
      setErr('')
      setMsg('تم تغيير كلمة المرور')
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  function whatsapp(account: StaffAccount) {
    const password = known[account.id]
    if (!password) {
      setErr('لتعرض كلمة المرور في الرسالة، اضبط كلمة مرور جديدة لهذا الموظف من زر «تعديل» ثم أعد الإرسال.')
      return
    }
    setErr('')
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const target = toInternationalPhone(account.phone || (/^5\d{8}$/.test(account.username) ? account.username : ''))
    if (!/^9665\d{8}$/.test(target)) {
      setErr('لا يوجد رقم جوال سعودي صالح لهذا الموظف لإرسال الرسالة. أضف رقم جواله أولًا.')
      return
    }
    const message = [
      `بيانات الدخول - ${settings?.name ?? 'مطاعم ومطابخ وادي دوعن'}`,
      `رابط الدخول: ${origin}/login`,
      `اسم المستخدم: ${account.username}`,
      `كلمة المرور: ${password}`,
    ].join('\n')
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
              <ShieldCheck className="size-4" aria-hidden="true" />
              حسابات وصلاحيات الموظفين
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              أنشئ حسابات لموظفي المطعم والمطبخ، وحدّد صلاحيات كل موظف على حدة.
            </p>
          </div>
          <Button onClick={() => { setDraft(blank()); setErr(''); setMsg('') }}>
            <UserPlus aria-hidden="true" />
            إضافة موظف
          </Button>
        </div>

        {draft && (
          <div className="flex flex-col gap-4 rounded-lg border border-primary bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الاسم الكامل (إلزامي)">
                <Input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} />
              </Field>
              <Field label="اسم المستخدم" hint="رقم الجوال (مثال 0551234567) أو رقم الهوية الوطنية">
                <Input dir="ltr" value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} />
              </Field>
              <Field label="رقم جوال الموظف (لإرسال بيانات الدخول)">
                <Input dir="ltr" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="05xxxxxxxx" />
              </Field>
              <Field label="الدور">
                <Select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as StaffAccountRole })}>
                  {STAFF_ACCOUNT_ROLES.filter((r) => r.id !== 'owner').map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label={draft.id ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور'}
                hint="8 خانات على الأقل وتجمع بين حروف وأرقام"
                className="sm:col-span-2"
              >
                <Input dir="ltr" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
              </Field>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">مصفوفة الصلاحيات</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" onClick={() => setDraft({ ...draft, permissions: [...ALL_PERMISSIONS] })}>
                    تفعيل الكل
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setDraft({ ...draft, permissions: [] })}>
                    تعطيل الكل
                  </Button>
                </div>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {STAFF_PERMISSIONS.map((p) => {
                  const on = draft.permissions.includes(p.id)
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                      <span className="text-sm">{p.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`${on ? 'تعطيل' : 'تفعيل'} ${p.label}`}
                        onClick={() => togglePermission(p.id)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? 'right-0.5' : 'right-[22px]'}`} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save}>حفظ</Button>
              <Button variant="outline" onClick={() => setDraft(null)}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {err && <Notice>{err}</Notice>}
        {msg && <Notice className="bg-emerald-600/10 text-emerald-700">{msg}</Notice>}
        {loadError && <Notice>{(loadError as Error).message}</Notice>}
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-right">
              <th className="p-3 font-semibold">الاسم</th>
              <th className="p-3 font-semibold">اسم المستخدم</th>
              <th className="p-3 font-semibold">الدور</th>
              <th className="p-3 font-semibold">الصلاحيات</th>
              <th className="p-3 font-semibold">آخر دخول</th>
              <th className="p-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(accounts ?? []).map((a) => (
              <tr key={a.id} className="border-b align-top last:border-0">
                <td className="p-3">
                  <p className="font-medium">{a.fullName || '—'}</p>
                  {a.phone && (
                    <p dir="ltr" className="text-right text-xs text-muted-foreground">
                      {a.phone}
                    </p>
                  )}
                </td>
                <td className="p-3 font-mono text-xs" dir="ltr">
                  {a.username}
                </td>
                <td className="p-3">
                  <Badge tone={a.role === 'kitchen' ? 'accent' : 'primary'}>
                    {STAFF_ACCOUNT_ROLES.find((r) => r.id === a.role)?.label ?? a.role}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {a.role === 'owner' ? 'كل الصلاحيات' : `${a.permissions.length} من ${STAFF_PERMISSIONS.length}`}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {a.lastSignInAt ? formatDateTime(a.lastSignInAt) : 'لم يسجّل بعد'}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`تعديل ${a.fullName}`}
                      onClick={() => {
                        setDraft({
                          id: a.id,
                          fullName: a.fullName,
                          username: a.username,
                          phone: a.phone,
                          role: a.role,
                          password: '',
                          permissions: [...a.permissions],
                        })
                        setErr('')
                        setMsg('')
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`تغيير كلمة مرور ${a.fullName}`} onClick={() => changePassword(a)}>
                      <KeyRound />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`إرسال بيانات الدخول إلى ${a.fullName} واتساب`} onClick={() => whatsapp(a)}>
                      <MessageCircle className="text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`حذف ${a.fullName}`} onClick={() => remove(a)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(accounts ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  لا توجد حسابات موظفين بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
