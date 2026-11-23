'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Notice, Textarea } from '@/components/ui/fields'
import { apiSend, fileToDataUrl, useSettings } from '@/lib/client'
import type { Settings } from '@/lib/types'

export function BrandingPanel() {
  const { data, mutate } = useSettings()
  if (!data) return <p className="text-muted-foreground">جارٍ التحميل...</p>
  return <BrandingForm key={JSON.stringify(data)} initial={data} onSaved={(s) => mutate(s, { revalidate: false })} />
}

function BrandingForm({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const [s, setS] = useState(initial)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }))

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const { gateways: _g, ...rest } = s
      onSaved(await apiSend<Settings>('/api/settings', 'PUT', rest))
      setMsg({ ok: true, text: 'تم حفظ الهوية بنجاح' })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <div className="flex items-center gap-4 md:col-span-2">
          <img src={s.logo} alt="الشعار الحالي" className="size-20 rounded-full border object-cover" />
          <Field label="تغيير الشعار" hint="PNG أو JPG حتى 1 ميجابايت">
            <Input
              type="file"
              accept="image/*"
              className="py-1.5"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                try {
                  set('logo', await fileToDataUrl(f, 1))
                } catch (err) {
                  setMsg({ ok: false, text: (err as Error).message })
                }
              }}
            />
          </Field>
        </div>
        <Field label="اسم النشاط">
          <Input value={s.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="الشعار النصي">
          <Input value={s.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </Field>
        <Field label="النبذة التعريفية" className="md:col-span-2">
          <Textarea value={s.about} onChange={(e) => set('about', e.target.value)} />
        </Field>
        <Field label="اللون الأساسي">
          <div className="flex gap-2">
            <input type="color" aria-label="اختيار اللون الأساسي" value={s.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} className="h-10 w-14 rounded-lg border" />
            <Input dir="ltr" value={s.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} />
          </div>
        </Field>
        <Field label="اللون الثانوي">
          <div className="flex gap-2">
            <input type="color" aria-label="اختيار اللون الثانوي" value={s.accentColor} onChange={(e) => set('accentColor', e.target.value)} className="h-10 w-14 rounded-lg border" />
            <Input dir="ltr" value={s.accentColor} onChange={(e) => set('accentColor', e.target.value)} />
          </div>
        </Field>
      </Card>

      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <h3 className="font-heading text-lg font-bold md:col-span-2">بيانات التواصل والسجلات</h3>
        <Field label="الجوال الرئيسي">
          <Input dir="ltr" value={s.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="جوال إضافي">
          <Input dir="ltr" value={s.phone2} onChange={(e) => set('phone2', e.target.value)} />
        </Field>
        <Field label="رقم واتساب" hint="بالصيغة الدولية بدون + مثل 9665xxxxxxxx">
          <Input dir="ltr" value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="البريد الإلكتروني">
          <Input dir="ltr" type="email" value={s.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="المدينة">
          <Input value={s.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="الحي">
          <Input value={s.district} onChange={(e) => set('district', e.target.value)} />
        </Field>
        <Field label="الرقم الضريبي">
          <Input dir="ltr" value={s.vatNumber} onChange={(e) => set('vatNumber', e.target.value)} />
        </Field>
        <Field label="السجل التجاري">
          <Input dir="ltr" value={s.crNumber} onChange={(e) => set('crNumber', e.target.value)} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h3 className="font-heading text-lg font-bold">ساعات العمل</h3>
        {s.hours.map((h, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="الفترة" className="flex-1">
              <Input value={h.label} onChange={(e) => set('hours', s.hours.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            </Field>
            <Field label="الوقت" className="flex-1">
              <Input value={h.time} onChange={(e) => set('hours', s.hours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
            </Field>
            <Button variant="outline" size="icon-lg" className="size-10" aria-label="حذف الفترة" onClick={() => set('hours', s.hours.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button variant="outline" className="self-start" onClick={() => set('hours', [...s.hours, { label: '', time: '' }])}>
          <Plus aria-hidden="true" />
          إضافة فترة
        </Button>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h3 className="font-heading text-lg font-bold">المواقع على الخريطة</h3>
        {s.locations.map((loc, i) => {
          const upd = (patch: Partial<typeof loc>) => set('locations', s.locations.map((x, j) => (j === i ? { ...x, ...patch } : x)))
          return (
            <div key={loc.id} className="grid gap-2 rounded-lg bg-muted/50 p-3 sm:grid-cols-4">
              <Field label="الاسم">
                <Input value={loc.name} onChange={(e) => upd({ name: e.target.value })} />
              </Field>
              <Field label="العنوان">
                <Input value={loc.address} onChange={(e) => upd({ address: e.target.value })} />
              </Field>
              <Field label="خط العرض">
                <Input dir="ltr" type="number" step="any" value={loc.lat} onChange={(e) => upd({ lat: Number(e.target.value) })} />
              </Field>
              <Field label="خط الطول">
                <Input dir="ltr" type="number" step="any" value={loc.lng} onChange={(e) => upd({ lng: Number(e.target.value) })} />
              </Field>
            </div>
          )
        })}
      </Card>

      {msg && (msg.ok ? <p role="status" className="rounded-lg bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">{msg.text}</p> : <Notice>{msg.text}</Notice>)}
      <Button size="lg" className="h-11 self-start px-8" onClick={save} disabled={saving}>
        {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
        حفظ التغييرات
      </Button>
    </div>
  )
}
