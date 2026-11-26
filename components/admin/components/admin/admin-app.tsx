'use client'

import { useState } from 'react'
import {
  BarChart3,
  ClipboardList,
  FileText,
  Landmark,
  MapPinned,
  MessageSquareWarning,
  Palette,
  Receipt,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OverviewPanel } from './overview-panel'
import { BrandingPanel } from './branding-panel'
import { MenuPanel } from './menu-panel'
import { ZonesPanel } from './zones-panel'
import { PurchasesPanel } from './purchases-panel'
import { LettersPanel } from './letters-panel'
import { FinancePanel } from './finance-panel'
import { StaffPanel } from './staff-panel'
import { OrdersPanel } from './orders-panel'
import { ComplaintsPanel } from './complaints-panel'

const SECTIONS = [
  { id: 'overview', label: 'نظرة عامة وتقارير', icon: BarChart3, Panel: OverviewPanel },
  { id: 'orders', label: 'متابعة الطلبات', icon: ClipboardList, Panel: OrdersPanel },
  { id: 'complaints', label: 'الشكاوى والمقترحات', icon: MessageSquareWarning, Panel: ComplaintsPanel },
  { id: 'menu', label: 'المنيو والأصناف', icon: UtensilsCrossed, Panel: MenuPanel },
  { id: 'zones', label: 'أحياء ورسوم التوصيل', icon: MapPinned, Panel: ZonesPanel },
  { id: 'purchases', label: 'المشتريات', icon: Receipt, Panel: PurchasesPanel },
  { id: 'letters', label: 'الخطابات والمطبوعات', icon: FileText, Panel: LettersPanel },
  { id: 'finance', label: 'الإدارة المالية', icon: Landmark, Panel: FinancePanel },
  { id: 'staff', label: 'الموظفون والصلاحيات', icon: ShieldCheck, Panel: StaffPanel },
  { id: 'branding', label: 'الهوية البصرية', icon: Palette, Panel: BrandingPanel },
] as const

export function AdminApp() {
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('overview')
  const section = SECTIONS.find((s) => s.id === active)!
  const Panel = section.Panel

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 print:p-0 lg:flex-row">
      <nav aria-label="أقسام لوحة التحكم" className="shrink-0 print:hidden lg:w-60">
        <h1 className="mb-4 font-heading text-2xl font-bold">لوحة التحكم</h1>
        <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
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
        <h2 className="mb-5 font-heading text-2xl font-bold print:hidden">{section.label}</h2>
        <Panel />
      </main>
    </div>
  )
}
