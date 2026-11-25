'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Notice, Textarea } from '@/components/ui/fields'
import { apiSend } from '@/lib/client'
import { cn } from '@/lib/utils'

/** شاشة تقييم الخدمة التي تظهر للعميل مباشرة بعد إتمام الدفع الإلكتروني لطلب الطاولة. */
export function ServiceRating() {
  const params = useSearchParams()
  const orderId = params.get('order') ?? undefined
  const table = params.get('table') ?? undefined
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await apiSend('/api/ratings', 'POST', { orderId, table, rating, comment })
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto size-16 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-bold">شكرًا لتقييمك</h1>
        <p className="mt-2 text-muted-foreground">
          نسعد بخدمتك دائمًا{table ? ` في طاولة ${table}` : ''}. تم إغلاق الطاولة بنجاح.
        </p>
        <Link href="/restaurant" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
          طلب جديد
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card className="flex flex-col gap-5 p-6">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">تقييم الخدمة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تم إتمام الدفع بنجاح{table ? ` - طاولة ${table}` : ''}. رأيك يساعدنا على تطوير خدمتنا.
          </p>
        </div>
        <div className="flex justify-center gap-2" role="radiogroup" aria-label="تقييم الخدمة">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} من 5`}
              onClick={() => setRating(n)}
              className="transition hover:scale-110"
            >
              <Star className={cn('size-10', n <= rating ? 'fill-accent text-accent' : 'text-muted-foreground')} aria-hidden="true" />
            </button>
          ))}
        </div>
        <Field label="ملاحظات (اختياري)">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder="أخبرنا عن تجربتك..."
            className="min-h-20"
          />
        </Field>
        {error && <Notice>{error}</Notice>}
        <Button size="lg" className="h-11 text-base" disabled={saving} onClick={submit}>
          إرسال التقييم
        </Button>
      </Card>
    </main>
  )
}
