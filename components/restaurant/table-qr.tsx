'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input } from '@/components/ui/fields'
import { useSettings } from '@/lib/client'

export function TableQr() {
  const { data: settings } = useSettings()
  const [origin, setOrigin] = useState('')
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(12)

  useEffect(() => setOrigin(window.location.origin), [])

  const tables = Array.from({ length: Math.max(0, Math.min(to, from + 99) - from + 1) }, (_, i) => from + i)

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-end gap-3 p-5 print:hidden">
        <Field label="من طاولة">
          <Input type="number" min={1} value={from} onChange={(e) => setFrom(Number(e.target.value) || 1)} className="w-28" />
        </Field>
        <Field label="إلى طاولة">
          <Input type="number" min={from} value={to} onChange={(e) => setTo(Number(e.target.value) || from)} className="w-28" />
        </Field>
        <Button size="lg" className="h-10" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          طباعة الرموز
        </Button>
        <p className="w-full text-sm text-muted-foreground">
          يمسح العميل الرمز فيفتح المنيو مع تحديد رقم الطاولة تلقائيًا في الطلب.
        </p>
      </Card>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {origin &&
          tables.map((n) => (
            <li key={n} className="flex break-inside-avoid flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center">
              <p className="font-heading text-sm font-bold">{settings?.name}</p>
              <QRCodeSVG value={`${origin}/restaurant?table=${n}`} size={140} level="M" title={`رمز طاولة ${n}`} />
              <p className="text-lg font-bold">طاولة {n}</p>
              <p className="text-xs text-muted-foreground">امسح للطلب</p>
            </li>
          ))}
      </ul>
    </div>
  )
}
