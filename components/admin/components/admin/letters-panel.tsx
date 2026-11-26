'use client'

import { useEffect, useState } from 'react'
import { FilePlus2, Mail, MessageCircle, PenLine, Printer, RotateCcw, Save, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice, Select, Textarea } from '@/components/ui/fields'
import { Barcode } from '@/components/documents/barcode'
import { SignaturePad } from '@/components/documents/signature-pad'
import { apiSend, useCollection, useSettings } from '@/lib/client'
import { formatDate, toInternationalPhone } from '@/lib/format'
import { LETTER_TYPES, RECIPIENT_TITLES, SIGNER_ROLES, type Letter, type LetterType } from '@/lib/types'
import { cn } from '@/lib/utils'

type Draft = Omit<Letter, 'id' | 'createdAt'> & { id?: string }

/** وسائل إرسال/طباعة الخطاب التي تُسجَّل عند الأرشفة. */
type SendVia = 'print' | 'email' | 'whatsapp'

/** مفتاح التوقيع المحفوظ في ملف صاحب الصلاحية على هذا الجهاز. */
const SIGNATURE_KEY = 'wadidoan:saved-signature'

const EMPTY_FILTERS = { number: '', date: '', title: '', recipient: '', type: '' }

const blank = (): Draft => ({
  type: 'letter',
  number: '',
  title: '',
  recipient: '',
  recipientTitle: 'الموقر',
  date: new Date().toISOString().slice(0, 10),
  attachments: '',
  body: '',
  signerRole: 'المدير العام',
  signerName: '',
  signature: '',
  isTemplate: false,
})

export function LettersPanel() {
  const { data: settings } = useSettings()
  const { data: letters, mutate } = useCollection<Letter>('letters')
  const [draft, setDraft] = useState<Draft>(blank)
  const [view, setView] = useState<'archive' | 'templates'>('archive')
  const [msg, setMsg] = useState('')
  const [nextNumber, setNextNumber] = useState('')
  const [savedSignature, setSavedSignature] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  // الترقيم الإلكتروني السنوي: نعرض الرقم المتوقع من الخادم قبل الحفظ.
  useEffect(() => {
    let active = true
    const query = draft.date ? `?date=${draft.date}` : ''
    fetch(`/api/letters/next-number${query}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { number?: string } | null) => {
        if (active && data?.number) setNextNumber(data.number)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [draft.date])

  // استرجاع التوقيع المحفوظ في ملف صاحب الصلاحية.
  useEffect(() => {
    setSavedSignature(localStorage.getItem(SIGNATURE_KEY) ?? '')
  }, [])

  const list = (letters ?? []).filter((l) => (view === 'templates' ? l.isTemplate : !l.isTemplate))
  // الاستعلام عن الخطابات: فلترة متقدمة (رقم/تاريخ/موضوع/جهة/نوع).
  const filtered = list.filter((l) => {
    if (filters.number && !(l.number ?? '').includes(filters.number.trim())) return false
    if (filters.date && l.date !== filters.date) return false
    if (filters.title && !l.title.includes(filters.title.trim())) return false
    if (filters.recipient && !l.recipient.includes(filters.recipient.trim())) return false
    if (filters.type && l.type !== filters.type) return false
    return true
  })
  const docNumber = draft.number || nextNumber || '—'
  const barcodeValue = [draft.number || nextNumber, draft.date].filter(Boolean).join('|')

  function saveSignatureToProfile() {
    if (!draft.signature) return
    localStorage.setItem(SIGNATURE_KEY, draft.signature)
    setSavedSignature(draft.signature)
    setMsg('تم حفظ التوقيع في ملفك')
  }

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

  /**
   * يضمن أرشفة الخطاب في قاعدة البيانات ويولّد رقم صادر تسلسليًا سنويًا (عند غيابه)،
   * ويسجّل وسيلة الإرسال/الطباعة ووقتها — تُستدعى تلقائيًا عند الطباعة أو الإرسال.
   */
  async function archiveLetter(via: SendVia): Promise<Letter | null> {
    if (!draft.title.trim() || !draft.body.trim()) {
      setMsg('العنوان ونص الخطاب مطلوبان')
      return null
    }
    const body = {
      ...draft,
      isTemplate: false,
      number: draft.number || nextNumber,
      sentVia: via,
      sentAt: new Date().toISOString(),
    } satisfies Draft
    const saved =
      draft.id && !draft.isTemplate
        ? await apiSend<Letter>(`/api/db/letters/${draft.id}`, 'PATCH', body)
        : await apiSend<Letter>('/api/db/letters', 'POST', body)
    setDraft({ ...saved })
    await mutate()
    return saved
  }

  /** الطباعة: تُؤرشف الخطاب أولًا ثم تُفتح نافذة الطباعة (يمكن الحفظ بصيغة PDF). */
  async function printLetter() {
    setMsg('')
    const saved = await archiveLetter('print')
    if (!saved) return
    setMsg(`تمت أرشفة الخطاب برقم صادر ${saved.number}`)
    window.print()
  }

  /** الإرسال عبر البريد الإلكتروني: أرشفة + فتح رسالة جاهزة بالمحتوى. */
  async function sendByEmail() {
    setMsg('')
    const saved = await archiveLetter('email')
    if (!saved) return
    const subject = `خطاب رقم ${saved.number} - ${saved.title}`
    const text = `${saved.title}\n\n${saved.body}\n\n—\n${settings?.name ?? ''}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
    setMsg(`تمت الأرشفة (${saved.number}) — أرفق ملف PDF المحفوظ ثم أرسل`)
  }

  /** الإرسال عبر واتساب: أرشفة + فتح محادثة واتساب بنص الخطاب. */
  async function sendByWhatsapp() {
    setMsg('')
    const saved = await archiveLetter('whatsapp')
    if (!saved) return
    const text = `خطاب رقم ${saved.number}\n${saved.title}\n\n${saved.body}`
    const phone = toInternationalPhone(settings?.whatsapp ?? '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
    setMsg(`تمت الأرشفة (${saved.number}) — أرفق ملف PDF في محادثة واتساب`)
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
            <Field label="رقم الخطاب (تلقائي)" hint="تسلسلي سنوي يُولَّد إلكترونيًا مثل 2026/001">
              <Input readOnly value={draft.number || nextNumber || '—'} className="bg-muted" />
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
            <Field label="اللقب الختامي">
              <Select
                value={draft.recipientTitle}
                onChange={(e) => setDraft({ ...draft, recipientTitle: e.target.value })}
              >
                {RECIPIENT_TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="منصب صاحب الصلاحية">
              <Select value={draft.signerRole} onChange={(e) => setDraft({ ...draft, signerRole: e.target.value })}>
                {SIGNER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="اسم صاحب الصلاحية">
              <Input value={draft.signerName} onChange={(e) => setDraft({ ...draft, signerName: e.target.value })} />
            </Field>
          </div>
          <Field label="نص المستند">
            <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="min-h-64" />
          </Field>

          <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-3">
            <span className="text-sm font-medium">التوقيع الإلكتروني</span>
            <SignaturePad value={draft.signature} onChange={(signature) => setDraft({ ...draft, signature })} />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={!draft.signature} onClick={saveSignatureToProfile}>
                <Save aria-hidden="true" />
                حفظ التوقيع في ملفي
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!savedSignature}
                onClick={() => setDraft({ ...draft, signature: savedSignature })}
              >
                <PenLine aria-hidden="true" />
                استخدام التوقيع المحفوظ
              </Button>
            </div>
            {savedSignature && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>التوقيع المحفوظ:</span>
                <img src={savedSignature} alt="التوقيع المحفوظ" className="h-8 rounded border bg-white px-1" />
              </div>
            )}
          </div>

          {msg && <Notice className={msg.startsWith('تم') ? 'bg-emerald-600/10 text-emerald-700' : undefined}>{msg}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => save(false)}>
              <Save aria-hidden="true" />
              حفظ وأرشفة
            </Button>
            <Button size="lg" variant="outline" onClick={() => save(true)}>
              حفظ كقالب
            </Button>
            <Button size="lg" variant="secondary" onClick={printLetter}>
              <Printer aria-hidden="true" />
              طباعة / PDF
            </Button>
            <Button size="lg" variant="secondary" onClick={sendByEmail}>
              <Mail aria-hidden="true" />
              إرسال بالبريد
            </Button>
            <Button size="lg" variant="secondary" onClick={sendByWhatsapp}>
              <MessageCircle aria-hidden="true" />
              إرسال واتساب
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            عند الطباعة أو الإرسال يُؤرشف الخطاب تلقائيًا في قاعدة البيانات ويُولَّد له رقم صادر تسلسلي سنوي.
            لحفظ الخطاب بصيغة PDF اختر «حفظ كـ PDF» من نافذة الطباعة.
          </p>
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

          {view === 'archive' && (
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Search className="size-4" aria-hidden="true" />
                  الاستعلام عن الخطابات
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
                  <RotateCcw aria-hidden="true" />
                  مسح
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="رقم الخطاب">
                  <Input
                    dir="ltr"
                    value={filters.number}
                    onChange={(e) => setFilters({ ...filters, number: e.target.value })}
                    placeholder="2026/001"
                  />
                </Field>
                <Field label="التاريخ">
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  />
                </Field>
                <Field label="الموضوع">
                  <Input
                    value={filters.title}
                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                    placeholder="جزء من عنوان الخطاب"
                  />
                </Field>
                <Field label="الجهة المرسل إليها">
                  <Input
                    value={filters.recipient}
                    onChange={(e) => setFilters({ ...filters, recipient: e.target.value })}
                    placeholder="اسم الجهة"
                  />
                </Field>
                <Field label="نوع الخطاب">
                  <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                    <option value="">الكل</option>
                    {LETTER_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {filtered.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا يوجد شيء هنا بعد</p>}
          <ul className="flex flex-col divide-y">
            {filtered.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col items-start text-right"
                  onClick={() =>
                    setDraft(
                      l.isTemplate
                        ? {
                            ...l,
                            id: undefined,
                            isTemplate: false,
                            number: '',
                            signature: '',
                            date: new Date().toISOString().slice(0, 10),
                          }
                        : { ...l },
                    )
                  }
                >
                  <span className="truncate text-sm font-medium">{l.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge>{LETTER_TYPES.find((t) => t.id === l.type)?.label}</Badge>
                    {l.number && <span dir="ltr">{l.number}</span>}
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
              {/* العمود الأيمن: الجهة واسم المشروع بحجم 14px داكن Bold */}
              <div className="flex-1 text-right">
                <p className="text-[14px] font-bold text-neutral-900">المملكة العربية السعودية</p>
                <p className="text-[14px] font-bold text-neutral-900">{settings?.name}</p>
                <p className="text-[11px] text-neutral-600">لتقديم الوجبات والولائم والمناسبات</p>
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

              {/* العمود الأيسر: ملصق الرقم والتاريخ مع الباركود */}
              <div className="flex flex-1 justify-end">
                <div className="w-full max-w-[64mm] rounded-md border-2 border-neutral-800/80 bg-neutral-50 p-2">
                  <dl className="space-y-0.5 text-[11px] leading-relaxed">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="font-semibold text-neutral-600">الرقم</dt>
                      <dd className="font-bold text-neutral-900" dir="ltr">
                        {docNumber}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="font-semibold text-neutral-600">التاريخ</dt>
                      <dd className="font-bold text-neutral-900">{draft.date ? formatDate(draft.date) : '—'}</dd>
                    </div>
                  </dl>
                  {barcodeValue && <Barcode value={barcodeValue} fluid height={30} className="mt-1.5" />}
                </div>
              </div>
            </header>

            {/* خط فاصل عريض يمتد بعرض الورقة كاملة */}
            <div className="mt-3 -mx-8 h-1 print:-mx-[18mm]" style={{ backgroundColor: settings?.primaryColor }} />

            {/* 2) جسم الخطاب */}
            <div className="mt-6 flex-1 text-[14px] leading-loose">
              {/* سطر الموضوع: محاذاة لليسار */}
              <p className="text-left text-base font-bold">
                <span className="text-neutral-500">الموضوع: </span>
                {draft.title || '...'}
              </p>
              {/* سطر الجهة المرسل إليها: اللقب الختامي ثابت في أقصى نهاية السطر (اليسار) */}
              <p className="mt-4 flex items-baseline">
                <span className="shrink-0 font-semibold">سعادة /&nbsp;</span>
                <span className="min-w-0 flex-1 px-1">
                  {draft.recipient ? (
                    <span className="font-semibold">{draft.recipient}</span>
                  ) : (
                    <span className="inline-block w-full border-b border-dotted border-neutral-500 align-baseline">&nbsp;</span>
                  )}
                </span>
                <span className="shrink-0 font-semibold">{draft.recipientTitle || 'الموقر'}</span>
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
                <span className="mt-6 text-neutral-500">التوقيع</span>
                {draft.signature ? (
                  <img src={draft.signature} alt="التوقيع الإلكتروني" className="mt-1 h-14 w-full object-contain" />
                ) : (
                  <span className="mt-1 block w-full border-b border-dotted border-neutral-500" />
                )}
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
