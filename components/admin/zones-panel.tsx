'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Notice } from '@/components/ui/fields'
import { apiSend, useCollection } from '@/lib/client'
import type { Zone } from '@/lib/types'

export function ZonesPanel() {
  const { data: zones, mutate } = useCollection<Zone>('zones')
  const [error, setError] = useState('')

  async function add(form: FormData) {
    setError('')
    const name = String(form.get('name') ?? '').trim()
    const fee = Number(form.get('fee'))
    if (!name || !(fee >= 0)) return setError('أدخل اسم الحي ورسوم صحيحة')
    await apiSend('/api/db/zones', 'POST', { name, fee, active: true })
    await mutate()
  }

  async function patch(id: string, body: Partial<Zone>) {
    await apiSend(`/api/db/zones/${id}`, 'PATCH', body)
    await mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <form action={add} className="flex flex-wrap items-end gap-3">
          <Field label="اسم الحي" className="flex-1">
            <Input name="name" required />
          </Field>
          <Field label="رسوم التوصيل (ر.س)">
            <Input name="fee" type="number" min={0} step="0.5" required className="w-36" />
          </Field>
          <Button type="submit" size="lg" className="h-10">
            <Plus aria-hidden="true" />
            إضافة
          </Button>
        </form>
        {error && <Notice className="mt-3">{error}</Notice>}
      </Card>
      <Card className="divide-y">
        {zones?.map((z) => (
          <div key={z.id} className="flex flex-wrap items-center gap-3 p-3">
            <Input aria-label="اسم الحي" defaultValue={z.name} onBlur={(e) => e.target.value.trim() && e.target.value !== z.name && patch(z.id, { name: e.target.value.trim() })} className="flex-1" />
            <Input
              aria-label={`رسوم ${z.name}`}
              type="number"
              min={0}
              defaultValue={z.fee}
              onBlur={(e) => Number(e.target.value) !== z.fee && patch(z.id, { fee: Math.max(0, Number(e.target.value)) })}
              className="w-28"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={z.active} onChange={() => patch(z.id, { active: !z.active })} />
              مفعّل
            </label>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`حذف ${z.name}`}
              onClick={async () => {
                await apiSend(`/api/db/zones/${z.id}`, 'DELETE')
                await mutate()
              }}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  )
}
