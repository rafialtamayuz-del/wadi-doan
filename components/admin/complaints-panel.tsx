'use client'

import { Badge, Card, Textarea } from '@/components/ui/fields'
import { Button } from '@/components/ui/button'
import { apiSend, useCollection } from '@/lib/client'
import { formatDateTime } from '@/lib/format'
import type { Complaint } from '@/lib/types'

export function ComplaintsPanel() {
  const { data: complaints, mutate } = useCollection<Complaint>('complaints', 10000)

  async function reply(id: string, form: FormData) {
    const text = String(form.get('reply') ?? '').trim()
    if (!text) return
    await apiSend(`/api/db/complaints/${id}`, 'PATCH', { reply: text.slice(0, 2000), status: 'resolved' })
    await mutate()
  }

  if (complaints?.length === 0) return <p className="text-muted-foreground">لا توجد شكاوى حاليًا</p>

  return (
    <ul className="flex flex-col gap-4">
      {complaints?.map((c) => (
        <li key={c.id}>
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  <span dir="ltr">{c.phone}</span> · {formatDateTime(c.createdAt)}
                  {c.orderNumber && ` · طلب #${c.orderNumber}`}
                </p>
              </div>
              <Badge tone={c.status === 'resolved' ? 'success' : 'warning'}>{c.status === 'resolved' ? 'تم الرد' : 'مفتوحة'}</Badge>
            </div>
            <p className="leading-relaxed">{c.message}</p>
            <form action={(f) => reply(c.id, f)} className="flex flex-col gap-2">
              <Textarea name="reply" aria-label={`الرد على ${c.name}`} defaultValue={c.reply} placeholder="اكتب ردك على العميل..." className="min-h-20" />
              <Button type="submit" className="self-start">
                {c.reply ? 'تحديث الرد' : 'إرسال الرد'}
              </Button>
            </form>
          </Card>
        </li>
      ))}
    </ul>
  )
}
