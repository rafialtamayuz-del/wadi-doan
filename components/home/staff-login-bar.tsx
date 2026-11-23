import Link from 'next/link'
import { ArrowLeft, ChefHat, LayoutDashboard, LockKeyhole, ReceiptText } from 'lucide-react'

// مداخل الموظفين والإدارة - كل مدخل يطلب تسجيل الدخول عبر Supabase Auth.
const ENTRIES = [
  {
    href: '/staff',
    title: 'موظفو المطعم',
    desc: 'إدارة الطلبات والكاشير وطباعة الفواتير والبونات.',
    icon: ReceiptText,
  },
  {
    href: '/kitchen',
    title: 'موظف المطبخ',
    desc: 'شاشة تحضير الطلبات والذبائح والولائم (KDS) وتحديث حالتها.',
    icon: ChefHat,
  },
  {
    href: '/admin',
    title: 'صاحب المشروع',
    desc: 'لوحة التحكم الشاملة للهوية والمنيو والأسعار والمشتريات والخطابات والحسابات والشكاوى.',
    icon: LayoutDashboard,
  },
]

export function StaffLoginBar() {
  return (
    <section aria-labelledby="staff-entry-title" className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
        <h2 id="staff-entry-title" className="font-heading text-2xl font-bold">
          دخول الموظفين والإدارة
        </h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          يتطلب تسجيل الدخول بالبريد وكلمة المرور
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {ENTRIES.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <span className="font-heading text-xl font-bold">{title}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">{desc}</span>
            <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-primary">
              تسجيل الدخول
              <ArrowLeft className="size-4 transition group-hover:-translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
