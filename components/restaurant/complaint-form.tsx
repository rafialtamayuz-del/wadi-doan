'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Notice, Textarea } from '@/components/ui/fields'
import { apiSend } from '@/lib/client'
import type { Complaint } from '@/lib/types'

export function ComplaintForm() {
  const [sent, setSent] = useState<Complaint | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(form: FormData) {
    setError('')
    setPending(true)
    try {
      setSent(
        await apiSend<Complaint>('/api/db/complaints', 'POST', {
          name: form.get('name'),
          phone: form.get('phone'),
          orderNumber: form.get('orderNumber'),
          message: form.get('message'),
        }),
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <Card className="mx-auto flex max-w-xl flex-col gap-3 p-6 text-center">
        <h2 className="font-heading text-xl font-bold">شكرًا لتواصلك معنا</h2>
        <p className="text-muted-foreground">
          تم استلام ملاحظتك وستقوم الإدارة بالرد عليك قريبًا. يمكنك متابعة الرد من تبويب &quot;تتبع الطلب&quot; باستخدام رقم جوالك.
        </p>
        <Button variant="outline" onClick={() => setSent(null)} className="self-center">
          إرسال ملاحظة أخرى
        </Button>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-xl p-6">
      <h2 className="mb-1 font-heading text-xl font-bold">الشكاوى والملاحظات</h2>
      <p className="mb-5 text-sm text-muted-foreground">رأيك يهمنا، تصل رسالتك مباشرة إلى صاحب المشروع.</p>
      <form action={submit} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="الاسم">
            <Input name="name" required minLength={2} />
          </Field>
          <Field label="رقم الجوال">
            <Input name="phone" type="tel" dir="ltr" required pattern="[+0-9\s]{9,15}" />
          </Field>
        </div>
        <Field label="رقم الطلب (اختياري)">
          <Input name="orderNumber" inputMode="numeric" />
        </Field>
        <Field label="الملاحظة أو الشكوى">
          <Textarea name="message" required minLength={5} maxLength={2000} />
        </Field>
        {error && <Notice>{error}</Notice>}
        <Button type="submit" size="lg" className="h-11" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          إرسال
        </Button>
      </form>
    </Card>
  )
}
