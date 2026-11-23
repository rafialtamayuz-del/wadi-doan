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
  number: '',
  title: '',
  recipient: '',
  date: new Date().toISOString().slice(0, 10),
  attachments: '',
  body: '',
  signerRole: 'المدير العام',
  signerName: '',
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
            <Field label="رقم الخطاب">
              <Input value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} />
            </Field>
            <Field label="المرفقات">
              <Input value={draft.attachments} onChange={(e) => setDraft({ ...draft, attachments: e.target.value })} />
            </Field>
            <Field label="الموضوع">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="الجهة المرسل إليها">
              <Input value={draft.recipient} onChange={(e) => setDraft({ ...draft, recipient: e.target.value })} />
            </Field>
            <Field label="منصب صاحب الصلاحية">
              <Input
                value={draft.signerRole}
                placeholder="مثال: المدير العام"
                onChange={(e) => setDraft({ ...draft, signerRole: e.target.value })}
              />
            </Field>
            <Field label="اسم صاحب الصلاحية">
              <Input value={draft.signerName} onChange={(e) => setDraft({ ...draft, signerName: e.target.value })} />
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

      <section aria-label="معاينة الخطاب الرسمي" className="print:col-span-full">
        <div className="letter-a4 mx-auto flex aspect-[1/1.414] w-full max-w-[210mm] flex-col bg-white text-[13px] text-neutral-900 shadow-lg ring-1 ring-black/5 print:aspect-auto print:max-w-none print:w-[210mm] print:min-h-[296mm] print:shadow-none print:ring-0">
          <div className="flex flex-1 flex-col px-8 pb-6 pt-8 print:px-[18mm] print:pb-[8mm] print:pt-[14mm]">
            {/* 1) الترويسة العلوية: ثلاثة أعمدة أفقية */}
            <header className="flex items-start justify-between gap-4">
              {/* العمود الأيمن */}
              <div className="flex-1 text-right">
                <p className="text-[13px]">المملكة العربية السعودية</p>
                <p className="font-heading text-xl font-bold" style={{ color: settings?.primaryColor }}>
                  {settings?.name}
                </p>
                <p className="text-[12px] text-neutral-600">لتقديم الوجبات والولائم والمناسبات</p>
              </div>

              {/* العمود الأوسط: الشعار الدائري */}
              <div className="flex w-24 shrink-0 flex-col items-center">
                {settings?.logo ? (
                  <img src={settings.logo} alt={`شعار ${settings?.name ?? ''}`} className="size-20 rounded-full object-cover" />
                ) : (
                  <div
                    className="flex size-20 items-center justify-center rounded-full border-2 p-1 text-center text-[9px] font-bold leading-tight"
                    style={{ borderColor: settings?.primaryColor, color: settings?.primaryColor }}
                  >
                    {settings?.name}
                  </div>
                )}
              </div>

              {/* العمود الأيسر: الرقم والتاريخ والمرفقات */}
              <div className="flex-1 text-left text-[13px]">
                <p>
                  <span className="font-semibold">الرقم: </span>
                  {draft.number || '—'}
                </p>
                <p>
                  <span className="font-semibold">التاريخ: </span>
                  {draft.date ? formatDate(draft.date) : '—'}
                </p>
                <p>
                  <span className="font-semibold">المرفقات: </span>
                  {draft.attachments || 'لا يوجد'}
                </p>
              </div>
            </header>

            {/* خط فاصل عريض يمتد بعرض الورقة كاملة */}
            <div className="mt-3 -mx-8 h-1 print:-mx-[18mm]" style={{ backgroundColor: settings?.primaryColor }} />

            {/* 2) جسم الخطاب */}
            <div className="mt-6 flex-1 text-[14px] leading-loose">
              <p className="text-base font-bold">
                <span className="text-neutral-500">الموضوع: </span>
                {draft.title || '...'}
              </p>
              <p className="mt-4">
                <span className="font-semibold">سعادة / </span>
                {draft.recipient ? (
                  <span className="font-semibold">{draft.recipient}</span>
                ) : (
                  <span className="mx-2 inline-block w-1/2 border-b border-dotted border-neutral-500 align-bottom">&nbsp;</span>
                )}
                {' الموقر'}
              </p>
              <p className="mt-4">السلام عليكم ورحمة الله وبركاته،،،</p>
              <div className="mt-4 whitespace-pre-wrap text-justify">
                {draft.body || 'اكتب نص الخطاب في المحرر لتظهر المعاينة هنا...'}
              </div>
            </div>

            {/* 3) الخاتمة */}
            <p className="mt-8 text-center font-semibold">وتفضلوا بقبول فائق الاحترام والتقدير،،،</p>

            {/* التوقيع والختم */}
            <div className="mt-10 flex items-start justify-between gap-8">
              {/* الختم في الوسط/اليمين */}
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  aria-label="الختم الرسمي"
                  className="flex size-28 rotate-[-12deg] flex-col items-center justify-center rounded-full border-[3px] border-double text-center text-[10px] font-bold leading-tight"
                  style={{ borderColor: settings?.primaryColor, color: settings?.primaryColor }}
                >
                  <span className="px-2">{settings?.name}</span>
                  <span className="mt-1 text-[9px]">س.ت {settings?.crNumber}</span>
                </div>
                <span className="text-[10px] text-neutral-400">الختم الرسمي</span>
              </div>

              {/* صاحب الصلاحية في الجانب الأيسر */}
              <div className="flex w-56 flex-col items-center text-center text-[13px]">
                <p className="font-semibold">{draft.signerRole || 'المدير العام'}</p>
                <span className="mt-10 text-neutral-500">التوقيع</span>
                <span className="mt-1 block w-full border-b border-dotted border-neutral-500" />
                <p className="mt-1 font-semibold">{draft.signerName || '................'}</p>
              </div>
            </div>
          </div>

          {/* 4) ذيل الخطاب */}
          <footer
            className="mt-auto w-full px-8 py-3 text-center text-[11px] leading-relaxed text-white print:px-[18mm]"
            style={{ backgroundColor: settings?.primaryColor }}
          >
            <p>
              {[settings?.city, settings?.district].filter(Boolean).join(' - ')}
              {' · '}
              {[settings?.phone, settings?.phone2].filter(Boolean).join(' - ')}
              {settings?.whatsapp ? ` · واتساب ${settings.whatsapp}` : ''}
            </p>
            {settings?.email && <p className="mt-0.5">{settings.email}</p>}
          </footer>
        </div>
      </section>
    </div>
  )
}
