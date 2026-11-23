'use client'

import { useState } from 'react'
import { ClipboardList, Printer, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrdersPanel } from '@/components/admin/orders-panel'
import { CashierPanel } from './cashier-panel'
import { PrintPanel } from './print-panel'

const TABS = [
  { id: 'orders', label: 'إدارة الطلبات', desc: 'متابعة كل الطلبات وتعديل حالتها', icon: ClipboardList, Panel: OrdersPanel },
  { id: 'cashier', label: 'الكاشير والدفع', desc: 'تحصيل وتأكيد المدفوعات', icon: Wallet, Panel: CashierPanel },
  { id: 'print', label: 'طباعة الفواتير والبونات', desc: 'إصدار الفاتورة الضريبية وبون المطبخ', icon: Printer, Panel: PrintPanel },
] as const

/** شاشة موظفي المطعم: إدارة الطلبات والكاشير وطباعة الفواتير. */
export function StaffApp() {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('orders')
  const tab = TABS.find((t) => t.id === active)!
  const Panel = tab.Panel

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <nav aria-label="أقسام شاشة موظفي المطعم" className="shrink-0 print:hidden lg:w-64">
        <h1 className="mb-4 font-heading text-2xl font-bold">شاشة موظفي المطعم</h1>
        <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(id)}
                aria-current={active === id ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="min-w-0 flex-1">
        <h2 className="mb-1 font-heading text-2xl font-bold print:hidden">{tab.label}</h2>
        <p className="mb-5 text-sm text-muted-foreground print:hidden">{tab.desc}</p>
        <Panel />
      </main>
    </div>
  )
}
