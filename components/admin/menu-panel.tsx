'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, Notice, Select, Textarea } from '@/components/ui/fields'
import { apiSend, fileToDataUrl, useCollection } from '@/lib/client'
import { effectivePrice, sar } from '@/lib/format'
import {
  ALLERGENS,
  BOOKING_CATEGORIES,
  CATEGORIES,
  KITCHEN_SECTIONS,
  MENU_SECTIONS,
  RESTAURANT_SECTIONS,
  type CategoryId,
  type MenuItem,
  type MenuSection,
} from '@/lib/types'
import { cn } from '@/lib/utils'

type Draft = Omit<MenuItem, 'id' | 'createdAt'> & { id?: string }
type SectionFilter = 'all' | 'restaurant' | 'kitchen'

const SECTION_FILTERS: { id: SectionFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'restaurant', label: 'أصناف المطعم' },
  { id: 'kitchen', label: 'أصناف المطبخ' },
]

/** القسم المناسب للتصنيف: تصنيفات الذبائح والولائم تابعة للمطبخ، وبقية التصنيفات للمطعم. */
const sectionForCategory = (category: CategoryId): MenuSection =>
  BOOKING_CATEGORIES.includes(category) ? 'kitchen' : 'restaurant'

const EMPTY: Draft = {
  name: '',
  category: 'restaurant',
  description: '',
  ingredients: '',
  price: 0,
  discount: 0,
  image: '',
  allergens: [],
  stock: null,
  active: true,
  menuSection: 'restaurant',
}

export function MenuPanel() {
  const { data: menu, mutate } = useCollection<MenuItem>('menu')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [filter, setFilter] = useState<CategoryId | 'all'>('all')
  const [section, setSection] = useState<SectionFilter>('all')
  const [error, setError] = useState('')

  const list = (menu ?? []).filter(
    (m) =>
      (section === 'all' || (section === 'restaurant' ? RESTAURANT_SECTIONS : KITCHEN_SECTIONS).includes(m.menuSection)) &&
      (filter === 'all' || m.category === filter),
  )

  async function save() {
    if (!draft) return
    setError('')
    if (!draft.name.trim() || draft.price <= 0) return setError('الاسم والسعر مطلوبان')
    if (draft.discount < 0 || draft.discount > 90) return setError('الخصم يجب أن يكون بين 0 و 90%')
    try {
      const { id, ...body } = draft
      if (id) await apiSend(`/api/db/menu/${id}`, 'PATCH', body)
      else await apiSend('/api/db/menu', 'POST', body)
      await mutate()
      setDraft(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function remove(item: MenuItem) {
    if (!confirm(`حذف "${item.name}"؟`)) return
    await apiSend(`/api/db/menu/${item.id}`, 'DELETE')
    await mutate()
  }

  async function toggle(item: MenuItem) {
    await apiSend(`/api/db/menu/${item.id}`, 'PATCH', { active: !item.active })
    await mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="فلترة الأصناف حسب القسم" className="flex gap-1 rounded-xl bg-muted p-1">
            {SECTION_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={section === f.id}
                onClick={() => setSection(f.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  section === f.id ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Select aria-label="تصفية حسب التصنيف" value={filter} onChange={(e) => setFilter(e.target.value as CategoryId | 'all')} className="w-52">
            <option value="all">كل التصنيفات</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <Button size="lg" onClick={() => setDraft({ ...EMPTY })}>
          <Plus aria-hidden="true" />
          إضافة صنف
        </Button>
      </div>

      {draft && (
        <Card className="grid gap-4 border-primary p-5 md:grid-cols-2">
          <h3 className="font-heading text-lg font-bold md:col-span-2">{draft.id ? 'تعديل الصنف' : 'صنف جديد'}</h3>
          <Field label="اسم الصنف">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="التصنيف">
            <Select
              value={draft.category}
              onChange={(e) => {
                const category = e.target.value as CategoryId
                setDraft({ ...draft, category, menuSection: sectionForCategory(category) })
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="مكان ظهور الصنف" hint="يحدد أين يظهر الصنف في واجهة العميل">
            <Select value={draft.menuSection} onChange={(e) => setDraft({ ...draft, menuSection: e.target.value as MenuSection })}>
              {MENU_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الوصف المختصر" className="md:col-span-2">
            <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-16" />
          </Field>
          <Field label="المكونات" className="md:col-span-2">
            <Input value={draft.ingredients} onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <Field label="السعر (ر.س شامل الضريبة)">
              <Input type="number" min={0} step="0.5" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            </Field>
            <Field label="الخصم %">
              <Input type="number" min={0} max={90} value={draft.discount} onChange={(e) => setDraft({ ...draft, discount: Number(e.target.value) })} />
            </Field>
            <Field label="الكمية المتاحة" hint="اتركه فارغًا لكمية مفتوحة">
              <Input
                type="number"
                min={0}
                value={draft.stock ?? ''}
                onChange={(e) => setDraft({ ...draft, stock: e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value))) })}
              />
            </Field>
          </div>
          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-sm font-medium">مسببات الحساسية</legend>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => {
                const on = draft.allergens.includes(a)
                return (
                  <label key={a} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${on ? 'border-primary bg-primary/10 text-primary' : ''}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => setDraft({ ...draft, allergens: on ? draft.allergens.filter((x) => x !== a) : [...draft.allergens, a] })}
                    />
                    {a}
                  </label>
                )
              })}
            </div>
          </fieldset>
          <div className="flex items-center gap-3 md:col-span-2">
            {draft.image && <img src={draft.image} alt="" className="size-16 rounded-lg object-cover" />}
            <Field label="صورة الصنف" hint="حتى 2 ميجابايت" className="flex-1">
              <Input
                type="file"
                accept="image/*"
                className="py-1.5"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  try {
                    setDraft({ ...draft, image: await fileToDataUrl(f, 2) })
                  } catch (err) {
                    setError((err as Error).message)
                  }
                }}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            معروض في المنيو
          </label>
          {error && <Notice className="md:col-span-2">{error}</Notice>}
          <div className="flex gap-2 md:col-span-2">
            <Button size="lg" onClick={save}>
              حفظ
            </Button>
            <Button size="lg" variant="outline" onClick={() => setDraft(null)}>
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-right">
              <th className="p-3 font-semibold">الصنف</th>
              <th className="p-3 font-semibold">التصنيف</th>
              <th className="p-3 font-semibold">مكان الظهور</th>
              <th className="p-3 font-semibold">السعر</th>
              <th className="p-3 font-semibold">الكمية</th>
              <th className="p-3 font-semibold">الحالة</th>
              <th className="p-3 font-semibold">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={m.image || '/images/hero.jpg'} alt="" className="size-10 rounded-md object-cover" />
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="p-3">{CATEGORIES.find((c) => c.id === m.category)?.label}</td>
                <td className="p-3">
                  <Badge tone={m.menuSection === 'both' ? 'accent' : m.menuSection === 'kitchen' ? 'primary' : 'neutral'}>
                    {MENU_SECTIONS.find((s) => s.id === m.menuSection)?.short}
                  </Badge>
                </td>
                <td className="p-3">
                  {sar(effectivePrice(m))}
                  {m.discount > 0 && <Badge tone="danger" className="mr-1">-{m.discount}%</Badge>}
                </td>
                <td className="p-3">{m.stock ?? 'مفتوحة'}</td>
                <td className="p-3">
                  <button type="button" onClick={() => toggle(m)} aria-label={`تبديل حالة ${m.name}`}>
                    <Badge tone={m.active ? 'success' : 'neutral'}>{m.active ? 'معروض' : 'مخفي'}</Badge>
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" aria-label={`تعديل ${m.name}`} onClick={() => setDraft({ ...m })}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`حذف ${m.name}`} onClick={() => remove(m)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
