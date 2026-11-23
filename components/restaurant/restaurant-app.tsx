'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, ShoppingBag } from 'lucide-react'
import { useCollection } from '@/lib/client'
import { effectivePrice, sar } from '@/lib/format'
import { BOOKING_CATEGORIES, CATEGORIES, RESTAURANT_SECTIONS, type CategoryId, type MenuItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/fields'
import { MenuItemCard } from './menu-item-card'
import { CartPanel, type CartLine } from './cart-panel'
import { BookingPanel } from './booking-panel'
import { TrackPanel } from './track-panel'
import { ComplaintForm } from './complaint-form'
import { TableQr } from './table-qr'

const TABS = [
  { id: 'booking', label: 'حجز ذبائح وولائم' },
  { id: 'menu', label: 'منيو المطعم والطلب' },
  { id: 'track', label: 'تتبع الطلب' },
  { id: 'complaint', label: 'الشكاوى والملاحظات' },
  { id: 'qr', label: 'رموز QR للطاولات' },
] as const
type TabId = (typeof TABS)[number]['id']

// المنيو الفوري يشمل أطباق المطعم والمقبلات والمشروبات وإفطار صائم فقط، أما الذبائح والولائم فلها قسم حجز مخصص.
const MENU_CATEGORIES = CATEGORIES.filter((c) => !BOOKING_CATEGORIES.includes(c.id))

export function RestaurantApp() {
  const params = useSearchParams()
  const table = params.get('table') ?? ''
  const paramTab = params.get('tab')
  const initialCat = params.get('cat')
  const [tab, setTab] = useState<TabId>(
    paramTab === 'booking' || (initialCat && BOOKING_CATEGORIES.includes(initialCat as CategoryId)) ? 'booking' : 'menu',
  )
  const [category, setCategory] = useState<CategoryId | 'all'>(
    MENU_CATEGORIES.some((c) => c.id === initialCat) ? (initialCat as CategoryId) : 'all',
  )
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const { data: menu, isLoading } = useCollection<MenuItem>('menu', 15000)

  const visible = useMemo(
    () =>
      (menu ?? []).filter(
        (m) =>
          m.active &&
          RESTAURANT_SECTIONS.includes(m.menuSection) &&
          !BOOKING_CATEGORIES.includes(m.category) &&
          (category === 'all' || m.category === category) &&
          (!query.trim() || m.name.includes(query.trim()) || m.description.includes(query.trim())),
      ),
    [menu, category, query],
  )

  /** يضبط كمية صنف في السلة (يُستخدم للمنيو والسلة معًا). */
  function setQty(key: string, qty: number) {
    setCart((prev) => {
      const line = prev[key]
      const itemId = line?.itemId ?? key
      const options = line?.options
      const next = { ...prev }
      if (qty <= 0) delete next[key]
      else next[key] = { key, itemId, options, qty: Math.min(qty, 100) }
      return next
    })
  }

  /** يضيف حجزًا بخياراته إلى السلة الموحدة. */
  function addBooking(itemId: string, options: string, qty: number) {
    const key = `${itemId}|${options}`
    setCart((prev) => ({ ...prev, [key]: { key, itemId, options, qty: Math.min((prev[key]?.qty ?? 0) + qty, 100) } }))
  }

  const lines = useMemo(
    () =>
      Object.values(cart)
        .map((l) => ({ key: l.key, qty: l.qty, options: l.options, item: menu?.find((m) => m.id === l.itemId) }))
        .filter((l): l is { key: string; qty: number; options?: string; item: MenuItem } => Boolean(l.item)),
    [cart, menu],
  )

  const count = lines.reduce((a, l) => a + l.qty, 0)
  const total = lines.reduce((sum, l) => sum + effectivePrice(l.item) * l.qty, 0)

  const cartPanel = (
    <CartPanel lines={lines} setQty={setQty} clear={() => setCart({})} table={table} onClose={() => setCartOpen(false)} />
  )
  const showCart = tab === 'menu' || tab === 'booking'

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 lg:pb-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">شاشة المطعم</h1>
          {table ? (
            <p className="mt-1 font-medium text-primary">أنت تطلب من طاولة رقم {table}</p>
          ) : (
            <p className="mt-1 text-muted-foreground">اطلب فورًا من المنيو أو احجز ذبيحتك ووليمتك من قسم المطبخ</p>
          )}
        </div>
        <div role="tablist" aria-label="أقسام شاشة المطعم" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition',
                tab === t.id ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {showCart && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section aria-label={tab === 'booking' ? 'حجز الذبائح والولائم' : 'المنيو'} className="flex flex-col gap-5">
            {tab === 'booking' ? (
              <BookingPanel menu={menu ?? []} onAdd={addBooking} />
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث عن طبق..."
                    aria-label="ابحث في المنيو"
                    className="h-11 pr-9"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="التصنيفات">
                  {[{ id: 'all' as const, label: 'الكل' }, ...MENU_CATEGORIES].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={category === c.id}
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
                        category === c.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {isLoading ? (
                  <p className="py-10 text-center text-muted-foreground">جارٍ تحميل المنيو...</p>
                ) : visible.length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground">لا توجد أصناف مطابقة</p>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map((item) => (
                      <li key={item.id}>
                        <MenuItemCard item={item} qty={cart[item.id]?.qty ?? 0} setQty={(q) => setQty(item.id, q)} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
          <aside className="hidden lg:block">
            <div className="sticky top-20">{cartPanel}</div>
          </aside>
        </div>
      )}

      {tab === 'track' && <TrackPanel />}
      {tab === 'complaint' && <ComplaintForm />}
      {tab === 'qr' && <TableQr />}

      {showCart && count > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-20 z-40 flex h-14 items-center justify-between rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-xl lg:hidden"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="size-5" aria-hidden="true" />
            عرض السلة ({count})
          </span>
          <span>{sar(total)}</span>
        </button>
      )}

      {cartOpen && (
        <div role="dialog" aria-modal="true" aria-label="السلة" className="fixed inset-0 z-50 flex flex-col bg-black/50 lg:hidden">
          <button type="button" className="h-16 shrink-0" aria-label="إغلاق السلة" onClick={() => setCartOpen(false)} />
          <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background p-3">{cartPanel}</div>
        </div>
      )}
    </main>
  )
}
