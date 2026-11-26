'use client'

import { useState } from 'react'
import { Building2, Landmark, Pencil, Plus, ScrollText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice, Select } from '@/components/ui/fields'
import { apiSend, useCollection, useSettings } from '@/lib/client'
import { PAYMENT_METHODS, type BankAccount, type PaymentMethod, type Settings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FinanceReports } from './finance-reports'
import { CompanyInvoices } from './company-invoices'

type Draft = Omit<BankAccount, 'id' | 'createdAt'> & { id?: string }
const EMPTY: Draft = { bank: '', holder: '', iban: '', accountNo: '', owner: 'restaurant', active: true }

const TABS = [
  { id: 'accounts', label: 'بوابات الدفع والحسابات', icon: Landmark },
  { id: 'reports', label: 'القوائم المالية', icon: ScrollText },
  { id: 'invoices', label: 'فواتير الشركات', icon: Building2 },
] as const

/** قسم الإدارة المالية: بوابات الدفع والحسابات البنكية والقوائم المالية وفواتير الشركات. */
export function FinancePanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('accounts')
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="أقسام الإدارة المالية" className="flex flex-wrap gap-1 rounded-xl bg-muted p-1 print:hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition', tab === id ? 'bg-card shadow-sm' : 'hover:bg-background/60')}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {tab === 'accounts' && <AccountsPanel />}
      {tab === 'reports' && <FinanceReports />}
      {tab === 'invoices' && <CompanyInvoices />}
    </div>
  )
}

function AccountsPanel() {
  const { data: settings, mutate: mutateSettings } = useSettings()
  const { data: accounts, mutate } = useCollection<BankAccount>('accounts')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')

  async function toggleGateway(id: PaymentMethod) {
    if (!settings) return
    const gateways = { ...settings.gateways, [id]: !settings.gateways[id] }
    if (!Object.values(gateways).some(Boolean)) return setError('يجب إبقاء طريقة دفع واحدة على الأقل مفعّلة')
    setError('')
    await mutateSettings(apiSend<Settings>('/api/settings', 'PUT', { gateways }), {
      optimisticData: { ...settings, gateways },
      revalidate: false,
    })
  }

  async function save() {
    if (!draft) return
    setError('')
    const iban = draft.iban.replace(/\s/g, '').toUpperCase()
    if (!draft.bank.trim() || !draft.holder.trim()) return setError('اسم البنك وصاحب الحساب مطلوبان')
    if (!/^SA\d{22}$/.test(iban)) return setError('رقم الآيبان يجب أن يبدأ بـ SA ويتكون من 24 خانة')
    const { id, ...body } = { ...draft, iban }
    if (id) await apiSend(`/api/db/accounts/${id}`, 'PATCH', body)
    else await apiSend('/api/db/accounts', 'POST', body)
    await mutate()
    setDraft(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <h3 className="mb-1 font-heading text-lg font-bold">بوابات وطرق الدفع</h3>
        <p className="mb-4 text-sm text-muted-foreground">فعّل أو أوقف ما يظهر للعميل عند إتمام الطلب.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((p) => {
            const on = settings?.gateways[p.id] ?? false
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`تفعيل ${p.label}`}
                  onClick={() => toggleGateway(p.id)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-primary' : 'bg-input'}`}
                >
                  <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? 'right-0.5' : 'right-[22px]'}`} />
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">الحسابات البنكية</h3>
          <Button onClick={() => setDraft({ ...EMPTY })}>
            <Plus aria-hidden="true" />
            إضافة حساب
          </Button>
        </div>

        {draft && (
          <div className="grid gap-3 rounded-lg border border-primary bg-muted/40 p-4 md:grid-cols-2">
            <Field label="اسم البنك">
              <Input value={draft.bank} onChange={(e) => setDraft({ ...draft, bank: e.target.value })} />
            </Field>
            <Field label="اسم صاحب الحساب">
              <Input value={draft.holder} onChange={(e) => setDraft({ ...draft, holder: e.target.value })} />
            </Field>
            <Field label="رقم الآيبان">
              <Input dir="ltr" value={draft.iban} onChange={(e) => setDraft({ ...draft, iban: e.target.value })} placeholder="SA0000000000000000000000" />
            </Field>
            <Field label="رقم الحساب">
              <Input dir="ltr" value={draft.accountNo} onChange={(e) => setDraft({ ...draft, accountNo: e.target.value })} />
            </Field>
            <Field label="تابع لـ">
              <Select value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value as Draft['owner'] })}>
                <option value="restaurant">المطعم</option>
                <option value="kitchen">المطبخ</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              يظهر للعملاء عند التحويل
            </label>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={save}>حفظ</Button>
              <Button variant="outline" onClick={() => setDraft(null)}>
                إلغاء
              </Button>
            </div>
          </div>
        )}
        {error && <Notice>{error}</Notice>}

        <ul className="grid gap-3 md:grid-cols-2">
          {accounts?.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{a.bank}</p>
                  <p className="text-sm text-muted-foreground">{a.holder}</p>
                </div>
                <div className="flex gap-1">
                  <Badge tone="primary">{a.owner === 'restaurant' ? 'المطعم' : 'المطبخ'}</Badge>
                  <Badge tone={a.active ? 'success' : 'neutral'}>{a.active ? 'مفعّل' : 'موقوف'}</Badge>
                </div>
              </div>
              <p dir="ltr" className="text-left font-mono text-sm">
                {a.iban}
              </p>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" aria-label={`تعديل حساب ${a.bank}`} onClick={() => setDraft({ ...a })}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`حذف حساب ${a.bank}`}
                  onClick={async () => {
                    if (!confirm('حذف الحساب البنكي؟')) return
                    await apiSend(`/api/db/accounts/${a.id}`, 'DELETE')
                    await mutate()
                  }}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
