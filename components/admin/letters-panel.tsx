'use client'

import { useState } from 'react'
import { FilePlus2, Printer, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice, Select, Textarea } from '@/components/ui/fields'
import { apiSend, useCollection, useSettings } from '@/lib/client'
import { formatDate } from '@/lib/format'
import { LETTER_TYPES, type Letter, type LetterType } from '@/lib/types'
import { cn } from '@/lib/utils'

type Draft = Omit<Letter, 'id' | 'createdAt'> & { id?: string }

const blank = (): Draft => ({
  type: 'letter',
  title: '',
  recipient: '',
  date: new Date().toISOString().slice(0, 10),
  body: '',
  isTemplate: false,
})

export function LettersPanel() {
  const { data: settings } = useSettings()
  const { data: letters, mutate } = useCollection<Letter>('letters')
  const [draft, setDraft] = useState<Draft>(blank)
  const [view, setView] = useState<'archive' | 'templates'>('archive')
  const [msg, setMsg] = useState('')

  const list = (letters ?? []).filter((l) => (view === 'templates' ? l.isTemplate : !l.isTemplate))

  async function save(asTemplate: boolean) {
    setMsg('')
    if (!draft.title.trim() || !draft.body.trim()) return setMsg('العنوان ونص الخطاب مطلوبان')
    const { id, ...body } = { ...draft, isTemplate: asTemplate }
    if (id && draft.isTemplate === asTemplate) await apiSend(`/api/db/letters/${id}`, 'PATCH', body)
    else {
      const created = await apiSend<Letter>('/api/db/letters', 'POST', body)
      setDraft({ ...created })
    }
    await mutate()
    setMsg(asTemplate ? 'تم حفظ القالب' : 'تمت الأرشفة')
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-5 print:hidden">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold">المحرر</h3>
            <Button variant="outline" onClick={() => setDraft(blank())}>
              <FilePlus2 aria-hidden="true" />
              جديد
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نوع المستند">
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as LetterType })}>
                {LETTER_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="التاريخ">
              <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field label="الموضوع">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="الجهة المرسل إليها">
              <Input value={draft.recipient} onChange={(e) => setDraft({ ...draft, recipient: e.target.value })} />
            </Field>
          </div>
          <Field label="نص المستند">
            <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="min-h-64" />
          </Field>
          {msg && <Notice className={msg.startsWith('تم') ? 'bg-emerald-600/10 text-emerald-700' : undefined}>{msg}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => save(false)}>
              <Save aria-hidden="true" />
              حفظ وأرشفة
            </Button>
            <Button size="lg" variant="outline" onClick={() => save(true)}>
              حفظ كقالب
            </Button>
            <Button size="lg" variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              طباعة
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1">
            {(['archive', 'templates'] as const).map((v) => (
              <button
                key={v}
                role="tab"
                type="button"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn('flex-1 rounded-md py-1.5 text-sm font-medium', view === v && 'bg-card shadow-sm')}
              >
                {v === 'archive' ? 'الأرشيف' : 'القوالب الجاهزة'}
              </button>
            ))}
          </div>
          {list.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا يوجد شيء هنا بعد</p>}
          <ul className="flex flex-col divide-y">
            {list.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col items-start text-right"
                  onClick={() =>
                    setDraft(
                      l.isTemplate
                        ? { ...l, id: undefined, isTemplate: false, date: new Date().toISOString().slice(0, 10) }
                        : { ...l },
                    )
                  }
                >
                  <span className="truncate text-sm font-medium">{l.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge>{LETTER_TYPES.find((t) => t.id === l.type)?.label}</Badge>
                    {l.date && formatDate(l.date)}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`حذف ${l.title}`}
                  onClick={async () => {
                    if (!confirm('حذف المستند؟')) return
                    await apiSend(`/api/db/letters/${l.id}`, 'DELETE')
                    await mutate()
                  }}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section aria-label="معاينة المستند" className="print:col-span-full">
        <div className="mx-auto flex aspect-[1/1.414] w-full max-w-[640px] flex-col bg-white p-8 text-[13px] text-neutral-900 shadow-lg ring-1 ring-black/5 print:max-w-none print:shadow-none print:ring-0">
          <header className="flex items-center justify-between gap-4 border-b-4 pb-4" style={{ borderColor: settings?.primaryColor }}>
            <div className="flex flex-col gap-0.5">
              <p className="font-heading text-lg font-bold" style={{ color: settings?.primaryColor }}>
                {settings?.name}
              </p>
              <p className="text-[11px] text-neutral-600">
                {settings?.city} - {settings?.district}
              </p>
              <p className="text-[11px] text-neutral-600">
                س.ت: {settings?.crNumber} · الرقم الضريبي: {settings?.vatNumber}
              </p>
            </div>
            {settings?.logo && <img src={settings.logo} alt="" className="size-16 rounded-full object-cover" />}
          </header>
          <div className="mt-5 flex justify-between text-[12px]">
            <p>
              <span className="font-semibold">التاريخ: </span>
              {draft.date ? formatDate(draft.date) : ''}
            </p>
            <p className="font-semibold">{LETTER_TYPES.find((t) => t.id === draft.type)?.label}</p>
          </div>
          {draft.recipient && (
            <p className="mt-4">
              <span className="font-semibold">إلى: </span>
              {draft.recipient}
            </p>
          )}
          {draft.title && (
            <p className="mt-2">
              <span className="font-semibold">الموضوع: </span>
              {draft.title}
            </p>
          )}
          <div className="mt-5 flex-1 whitespace-pre-wrap leading-loose">{draft.body || 'ابدأ الكتابة في المحرر لتظهر المعاينة هنا...'}</div>
          <footer className="mt-6 flex items-end justify-between">
            <div className="text-[11px] text-neutral-600">
              <p>{settings?.phone}</p>
              <p dir="ltr">{settings?.email}</p>
            </div>
            <div
              aria-label="ختم المشروع"
              className="flex size-28 rotate-[-12deg] flex-col items-center justify-center rounded-full border-[3px] border-double text-center text-[10px] font-bold leading-tight"
              style={{ borderColor: settings?.primaryColor, color: settings?.primaryColor }}
            >
              <span className="px-2">{settings?.name}</span>
              <span className="mt-1 text-[9px]">س.ت {settings?.crNumber}</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  )
}
