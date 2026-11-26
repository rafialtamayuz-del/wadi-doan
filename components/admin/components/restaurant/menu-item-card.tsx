'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/fields'
import { effectivePrice, sar } from '@/lib/format'
import { BOOKING_CATEGORIES, type MenuItem } from '@/lib/types'

export function MenuItemCard({ item, qty, setQty }: { item: MenuItem; qty: number; setQty: (q: number) => void }) {
  const [showDetails, setShowDetails] = useState(false)
  const price = effectivePrice(item)
  const soldOut = item.stock !== null && item.stock <= 0
  const max = item.stock ?? 100

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="relative">
        <img src={item.image || '/images/hero.png'} alt={item.name} className="aspect-[4/3] w-full object-cover" />
        <div className="absolute right-2 top-2 flex flex-wrap gap-1">
          {item.discount > 0 && <Badge className="bg-destructive text-white">خصم {item.discount}%</Badge>}
          {BOOKING_CATEGORIES.includes(item.category) && <Badge className="bg-card/90 text-foreground">يتطلب حجز موعد</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-bold leading-snug">{item.name}</h3>
          <div className="shrink-0 text-left">
            <p className="font-bold text-primary">{sar(price)}</p>
            {item.discount > 0 && <p className="text-xs text-muted-foreground line-through">{sar(item.price)}</p>}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          aria-expanded={showDetails}
          className="self-start text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {showDetails ? 'إخفاء المكونات' : 'المكونات ومسببات الحساسية'}
        </button>
        {showDetails && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-xs">
            <p>
              <span className="font-semibold">المكونات: </span>
              {item.ingredients}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-semibold">مسببات الحساسية:</span>
              {item.allergens.length ? (
                item.allergens.map((a) => (
                  <Badge key={a} tone="warning">
                    {a}
                  </Badge>
                ))
              ) : (
                <span>لا يوجد</span>
              )}
            </div>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-muted-foreground">
            {soldOut ? 'نفدت الكمية' : item.stock !== null ? `الكمية المتاحة: ${item.stock}` : 'متوفر'}
          </span>
          {qty === 0 ? (
            <Button size="lg" disabled={soldOut} onClick={() => setQty(1)} className="px-4">
              <Plus aria-hidden="true" />
              أضف
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="icon-lg" variant="outline" aria-label={`إنقاص ${item.name}`} onClick={() => setQty(qty - 1)}>
                <Minus />
              </Button>
              <span className="w-6 text-center font-bold" aria-live="polite">
                {qty}
              </span>
              <Button size="icon-lg" aria-label={`زيادة ${item.name}`} disabled={qty >= max} onClick={() => setQty(qty + 1)}>
                <Plus />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
