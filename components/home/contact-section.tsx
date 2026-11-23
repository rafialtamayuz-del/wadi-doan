import { Clock, Mail, Phone } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { LocationsMap } from './locations-map'

export function ContactSection({ settings }: { settings: Settings }) {
  return (
    <section aria-labelledby="contact-title" className="border-t bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-primary">زورونا</p>
            <h2 id="contact-title" className="font-heading text-3xl font-bold">
              ساعات العمل والتواصل
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Clock className="size-5 text-primary" aria-hidden="true" />
              ساعات العمل
            </h3>
            <dl className="divide-y rounded-2xl border bg-card">
              {settings.hours.map((h) => (
                <div key={h.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">{h.label}</dt>
                  <dd className="font-semibold" dir="rtl">
                    {h.time}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">أرقام التواصل</h3>
            <div className="flex flex-col gap-2">
              {[settings.phone, settings.phone2].filter(Boolean).map((p) => (
                <a key={p} href={`tel:${p}`} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary">
                  <Phone className="size-4 text-primary" aria-hidden="true" />
                  <span dir="ltr" className="font-semibold">
                    {p}
                  </span>
                </a>
              ))}
              <a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary">
                <Mail className="size-4 text-primary" aria-hidden="true" />
                <span dir="ltr">{settings.email}</span>
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-heading text-xl font-bold">موقع الفرع والمطبخ المركزي</h3>
          <LocationsMap locations={settings.locations} />
        </div>
      </div>
    </section>
  )
}
