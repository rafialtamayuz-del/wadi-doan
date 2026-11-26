'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Select } from '@/components/ui/fields'
import { effectivePrice, sar } from '@/lib/format'
import {
  BOOKING_CATEGORIES,
  BOOKING_TYPE_CHOICES,
  CATEGORIES,
  COOKING_STYLES,
  CUTTING_STYLES,
  CUT_STYLES,
  KITCHEN_SECTIONS,
  SLAUGHTER_CATEGORIES,
  type CategoryId,
  type MenuItem,
} from '@/lib/types'
import { cn } from '@/lib/utils'

// خيارات التصنيف الرئيسية: ذبيحة / وليمة / زواج / أضحية، مع إتاحة بقية أقسام المطبخ (الذبح والإعاشة).
const TYPE_CHOICES: { id: CategoryId; label: string }[] = [
  ...BOOKING_TYPE_CHOICES,
  ...CATEGORIES.filter((c) => BOOKING_CATEGORIES.includes(c.id) && !BOOKING_TYPE_CHOICES.some((t) => t.id === c.id)),
]

/**
 * قسم المطبخ المخصص لحجز الذبائح والأضاحي والولائم والإعاشة (منيو المطبخ).
 * يختار العميل التصنيف (ذبيحة / وليمة / زواج / أضحية) ثم نوع الذبيحة وطريقة الطبخ ونوع التقطيع
 * وطريقة التفصيل والكمية، ثم يضيفها إلى السلة الموحدة، ليحدد تاريخ ووقت التسليم عند إتمام الطلب.
 */
export function BookingPanel({
  menu,
  onAdd,
  initialCategory,
}: {
  menu: MenuItem[]
  onAdd: (itemId: string, options: string, qty: number) => void
  initialCategory?: CategoryId
}) {
  const [type, setType] = useState<CategoryId>(
    initialCategory && TYPE_CHOICES.some((t) => t.id === initialCategory) ? initialCategory : TYPE_CHOICES[0].id,
  )
  const items = useMemo(
    () => menu.filter((m) => m.active && KITCHEN_SECTIONS.includes(m.menuSection) && m.category === type),
    [menu, type],
  )
  const [itemId, setItemId] = useState('')
  const [cooking, setCooking] = useState<string>(COOKING_STYLES[0])
  const [cut, setCut] = useState<string>(CUT_STYLES[0])
  const [cutting, setCutting] = useState<string>(CUTTING_STYLES[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const selected = items.find((m) => m.id === itemId)
  const price = selected ? effectivePrice(selected) : 0
  const needsCutting = selected ? SLAUGHTER_CATEGORIES.includes(selected.category) : false
  const details = needsCutting ? `${cooking} · ${cut} · تفصيل: ${cutting}` : `${cooking} · ${cut}`

  function pickType(id: CategoryId) {
    setType(id)
    setItemId('')
    setAdded(false)
  }

  function add() {
    if (!selected) return
    onAdd(selected.id, details, Math.max(1, qty))
    setAdded(true)
    setQty(1)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-lg font-bold">منيو المطبخ وحجز ذبيحتك أو وليمتك</h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          اختر التصنيف (ذبيحة، وليمة، زواج، أضحية) ثم نوع الذبيحة وطريقة الطبخ ونوع التقطيع وطريقة التفصيل والكمية،
          وأضفها إلى السلة. سيُطلب منك تحديد تاريخ ووقت التسليم عند إتمام الطلب.
        </p>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">التصنيف</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="تصنيف الحجز">
            {TYPE_CHOICES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={type === t.id}
                onClick={() => pickType(t.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  type === t.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="نوع الذبيحة أو الوليمة">
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">اختر النوع</option>
            {items.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} - {sar(effectivePrice(m))}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="طريقة الطبخ">
            <Select value={cooking} onChange={(e) => setCooking(e.target.value)}>
              {COOKING_STYLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="نوع التقطيع">
            <Select value={cut} onChange={(e) => setCut(e.target.value)}>
              {CUT_STYLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {needsCutting && (
          <Field label="طريقة التفصيل" hint="حضرمي / ثلاجة / أرباع / كامل / تفصيل مخصص">
            <Select value={cutting} onChange={(e) => setCutting(e.target.value)}>
              {CUTTING_STYLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="الكمية">
          <Input
            type="number"
            min={1}
            max={100}
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-32"
          />
        </Field>

        {selected && (
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
            <span className="font-medium">
              {selected.name} · {details}
            </span>
            <span className="font-bold text-primary">{sar(price * Math.max(1, qty))}</span>
          </div>
        )}

        <Button size="lg" className="h-11 text-base" disabled={!selected} onClick={add}>
          {added ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {added ? 'أُضيف إلى السلة' : 'أضف إلى السلة'}
        </Button>

        {items.length === 0 && (
          <p className="rounded-lg bg-accent/20 px-3 py-2 text-xs leading-relaxed">
            لا توجد أنواع متاحة في هذا التصنيف حاليًا، اختر تصنيفًا آخر أو تواصل معنا هاتفيًا.
          </p>
        )}
      </Card>

      {items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-2xl border bg-card p-3">
              <img src={item.image || '/images/hero.png'} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="font-heading font-bold leading-snug">{item.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                <p className="mt-1 font-semibold text-primary">{sar(effectivePrice(item))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
