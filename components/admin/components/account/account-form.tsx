'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Notice } from '@/components/ui/fields'
import { useCurrentUser } from '@/lib/client'
import { STAFF_PERMISSIONS, permissionsFromUser } from '@/lib/permissions'
import { roleFromUser } from '@/lib/roles'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { STAFF_ACCOUNT_ROLES } from '@/lib/types'

/** صفحة «حسابي»: يتيح للموظف تغيير كلمة مرور حسابه بنفسه. */
export function AccountForm() {
  const { user, ready } = useCurrentUser()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const role = roleFromUser(user)
  const username = String((user?.user_metadata as Record<string, unknown> | undefined)?.username ?? user?.email ?? '')
  const owned = permissionsFromUser(user)
  const labels = STAFF_PERMISSIONS.filter((p) => owned.includes(p.id)).map((p) => p.label)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErr('')
    setMsg('')
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErr('كلمة المرور يجب أن تتكون من 8 خانات على الأقل وتجمع بين حروف وأرقام')
      return
    }
    if (password !== confirm) {
      setErr('كلمتا المرور غير متطابقتين')
      return
    }
    setBusy(true)
    const { error } = await supabaseBrowser().auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setErr('تعذّر تغيير كلمة المرور، حاول مرة أخرى')
      return
    }
    setPassword('')
    setConfirm('')
    setMsg('تم تغيير كلمة المرور بنجاح')
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Card className="flex flex-col gap-5 p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">حسابي</h1>
          <p className="mt-1 text-sm text-muted-foreground">يمكنك تغيير كلمة مرور حسابك، والاطلاع على صلاحياتك.</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">اسم المستخدم</dt>
            <dd dir="ltr" className="text-right font-mono">
              {ready ? username || '—' : '...'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">الدور</dt>
            <dd className="font-medium">{STAFF_ACCOUNT_ROLES.find((r) => r.id === role)?.label ?? '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">الصلاحيات</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {labels.length > 0 ? (
                labels.map((label) => (
                  <span key={label} className="rounded-full bg-card px-2 py-0.5 text-xs">
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">لا توجد صلاحيات مُفعّلة</span>
              )}
            </dd>
          </div>
        </dl>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="كلمة المرور الجديدة" hint="8 خانات على الأقل وتجمع بين حروف وأرقام">
            <Input type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="تأكيد كلمة المرور">
            <Input type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          {err && <Notice>{err}</Notice>}
          {msg && <Notice className="bg-emerald-600/10 text-emerald-700">{msg}</Notice>}
          <Button type="submit" size="lg" disabled={busy || !ready}>
            <KeyRound aria-hidden="true" />
            {busy ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
