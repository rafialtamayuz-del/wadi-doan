'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useSettings } from '@/lib/client'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { roleFromUser, staffNavLinks, type StaffRole } from '@/lib/roles'
import { cn } from '@/lib/utils'

const PUBLIC_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/restaurant', label: 'المطعم' },
]

export function SiteHeader({ className }: { className?: string }) {
  const { data } = useSettings()
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<StaffRole | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    const supabase = supabaseBrowser()
    void supabase.auth.getUser().then(({ data: auth }) => setRole(auth.user ? roleFromUser(auth.user) : null))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setRole(session?.user ? roleFromUser(session.user) : null)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabaseBrowser().auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = role ? [...PUBLIC_LINKS, ...staffNavLinks(role)] : PUBLIC_LINKS

  return (
    <header className={cn('sticky top-0 z-40 border-b bg-background/90 backdrop-blur print:hidden', className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src={data?.logo || '/images/logo.png'}
            alt=""
            className="size-10 rounded-full border bg-card object-cover"
          />
          <span className="font-heading text-base font-bold leading-tight text-balance sm:text-lg">
            {data?.name ?? 'مطاعم ومطابخ وادي دوعن'}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                    active && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
          {role ? (
            <Button variant="outline" size="lg" onClick={signOut}>
              <LogOut aria-hidden="true" />
              خروج
            </Button>
          ) : (
            <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <LogIn aria-hidden="true" />
              دخول
            </Link>
          )}
        </div>
      </div>
      <nav aria-label="التنقل الرئيسي للجوال" className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
        {links.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
