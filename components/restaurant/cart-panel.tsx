'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/fields'
import { effectivePrice, sar } from '@/lib/format'
import { BOOKING_CATEGORIES, type MenuItem } from '@/lib/types'
import { CheckoutForm } from './checkout-form'

export interface CartLine {
  key: string
  itemId: string
  qty: number
  options?: string
}

export function CartPanel({
  lines,
  setQty,
  clear,
  table,
  onClose,
}: {
  lines: { key: string; item: MenuItem; qty: number; options?: string }[]
  setQty: (key: string, qty: number) => void
  clear: () => void
  table: string
  onClose: () => void
}) {
  const [checkout, setCheckout] = useState(false)
  const subtotal = lines.reduce((s, l) => s + effectivePrice(l.item) * l.qty, 0)
  const isBooking = lines.some((l) => BOOKING_CATEGORIES.includes(l.item.category))

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
          <ShoppingBag className="size-5 text-primary" aria-hidden="true" />
          {checkout ? 'إتمام الطلب' : 'سلة الطلب'}
        </h2>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="إغلاق" onClick={onClose}>
          <X />
        </Button>
      </div>

      {lines.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">السلة فارغة، أضف أطباقك المفضلة من المنيو.</p>
      ) : checkout ? (
        <CheckoutForm lines={lines} subtotal={subtotal} isBooking={isBooking} table={table} onBack={() => setCheckout(false)} onDone={clear} />
      ) : (
        <>
          <ul className="flex flex-col divide-y">
            {lines.map(({ key, item, qty, options }) => (
              <li key={key} className="flex items-center gap-3 py-3">
                <img src={item.image} alt="" className="size-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  {options && <p className="truncate text-xs text-muted-foreground">{options}</p>}
                  <p className="text-xs text-muted-foreground">{sar(effectivePrice(item) * qty)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="outline" aria-label={`إنقاص ${item.name}`} onClick={() => setQty(key, qty - 1)}>
                    {qty === 1 ? <Trash2 /> : <Minus />}
                  </Button>
                  <span className="w-6 text-center text-sm font-bold">{qty}</span>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`زيادة ${item.name}`}
                    disabled={item.stock !== null && qty >= item.stock}
                    onClick={() => setQty(key, qty + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {isBooking && (
            <p className="rounded-lg bg-accent/20 px-3 py-2 text-xs leading-relaxed">
              سلتك تحتوي على ذبائح أو ولائم أو إعاشة، وسيُطلب منك تحديد تاريخ ووقت التسليم.
            </p>
          )}
          <div className="flex items-center justify-between border-t pt-3 font-semibold">
            <span>الإجمالي (شامل الضريبة)</span>
            <span className="text-lg text-primary">{sar(subtotal)}</span>
          </div>
          <Button size="lg" className="h-11 text-base" onClick={() => setCheckout(true)}>
            متابعة إلى الدفع
          </Button>
        </>
      )}
    </Card>
  )
}
