import Link from 'next/link'
import { CalendarCheck, UtensilsCrossed } from 'lucide-react'
import type { Settings } from '@/lib/types'

export function HomeHero({ settings }: { settings: Settings }) {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src="/images/hero.png"
        alt="صينية مندي بلحم الضأن والرز المزعفر"
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-l from-black/80 via-black/60 to-black/30" />
      <div className="mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center gap-6 px-4 py-20 text-white">
        <img
          src={settings.logo}
          alt={`شعار ${settings.name}`}
          className="size-20 rounded-full border-2 border-white/70 bg-white object-cover"
        />
        <p className="font-medium text-accent">
          {settings.city} - {settings.district}
        </p>
        <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight text-balance md:text-6xl">
          {settings.name}
        </h1>
        <p className="max-w-xl text-lg text-white/90 text-pretty md:text-xl">{settings.tagline}</p>
        <p className="max-w-2xl leading-relaxed text-white/80 text-pretty">{settings.about}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/restaurant"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            <UtensilsCrossed className="size-5" aria-hidden="true" />
            اطلب الآن
          </Link>
          <Link
            href="/restaurant?tab=booking"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 font-semibold backdrop-blur transition hover:bg-white/20"
          >
            <CalendarCheck className="size-5" aria-hidden="true" />
            احجز ذبيحتك أو وليمتك
          </Link>
        </div>
      </div>
    </section>
  )
}
