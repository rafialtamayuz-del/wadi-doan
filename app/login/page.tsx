'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, Field, Input } from '@/components/ui/fields'
import { loginIdToEmail } from '@/lib/roles'
import { supabaseBrowser } from '@/lib/supabase/browser'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    // يقبل اسم المستخدم (رقم الجوال أو رقم الهوية) أو البريد الإلكتروني.
    const { error: signInError } = await supabaseBrowser().auth.signInWithPassword({
      email: loginIdToEmail(identifier.trim()),
      password,
    })
    if (signInError) {
      setBusy(false)
      setError('بيانات الدخول غير صحيحة، تأكد من اسم المستخدم وكلمة المرور.')
      return
    }
    router.replace(next.startsWith('/') ? next : '/admin')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="font-heading text-2xl font-bold">تسجيل الدخول</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        هذه الشاشة مخصصة لموظفي المطعم والمطبخ وصاحب المشروع. الشاشة الرئيسية والمطعم متاحان للعملاء بدون تسجيل دخول.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <Field label="اسم المستخدم أو البريد الإلكتروني" hint="رقم الجوال أو رقم الهوية الوطنية">
          <Input
            dir="ltr"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </Field>
        <Field label="كلمة المرور">
          <Input
            type="password"
            dir="ltr"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? 'جارٍ تسجيل الدخول...' : 'دخول'}
        </Button>
      </form>
      <Link href="/" className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground">
        العودة إلى الصفحة الرئيسية
      </Link>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
