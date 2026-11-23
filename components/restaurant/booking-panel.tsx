'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, Select } from '@/components/ui/fields'
import { effectivePrice, sar } from '@/lib/format'
import { BOOKING_CATEGORIES, CATEGORIES, COOKING_STYLES, CUT_STYLES, KITCHEN_SECTIONS, type MenuItem } from '@/lib/types'

/**
 * قسم مخصص لحجز الذبائح والولائم والإعاشة.
 * يعرض الأصناف المخصصة للمطبخ (أو المشتركة بين المطعم والمطبخ)، ويختار العميل نوع الذبيحة/الوليمة
 * وطريقة الطبخ ونوع التقطيع والكمية، ثم يضيفها إلى السلة الموحدة، ليحدد تاريخ ووقت التسليم عند إتمام الطلب.
 */
export function BookingPanel({
  menu,
  onAdd,
}: {
  menu: MenuItem[]
  onAdd: (itemId: string, options: string, qty: number) => void
}) {
  const items = useMemo(
    () => menu.filter((m) => m.active && KITCHEN_SECTIONS.includes(m.menuSection) && BOOKING_CATEGORIES.includes(m.category)),
    [menu],
  )
  const [itemId, setItemId] = useState('')
  const [cooking, setCooking] = useState<string>(COOKING_STYLES[0])
  const [cut, setCut] = useState<string>(CUT_STYLES[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const selected = items.find((m) => m.id === itemId)
  const price = selected ? effectivePrice(selected) : 0

  function add() {
    if (!selected) return
    onAdd(selected.id, `${cooking} · ${cut}`, Math.max(1, qty))
    setAdded(true)
    setQty(1)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-lg font-bold">حجز ذبيحتك أو وليمتك</h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          اختر نوع الذبيحة أو الوليمة وطريقة الطبخ ونوع التقطيع والكمية، ثم أضفها إلى السلة. سيُطلب منك تحديد تاريخ ووقت
          التسليم عند إتمام الطلب.
        </p>

        <Field label="نوع الذبيحة أو الوليمة">
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">اختر النوع</option>
            {CATEGORIES.filter((c) => BOOKING_CATEGORIES.includes(c.id)).map((cat) => {
              const group = items.filter((m) => m.category === cat.id)
              if (group.length === 0) return null
              return (
                <optgroup key={cat.id} label={cat.label}>
                  {group.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {sar(effectivePrice(m))}
                    </option>
                  ))}
                </optgroup>
              )
            })}
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
              {selected.name} · {cooking} · {cut}
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
            لا توجد أنواع متاحة للحجز حاليًا، يرجى المحاولة لاحقًا أو التواصل معنا هاتفيًا.
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
