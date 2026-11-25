'use client'

import { useState } from 'react'
import { Check, Copy, MapPin, Navigation } from 'lucide-react'
import type { BusinessLocation } from '@/lib/types'
import { cn } from '@/lib/utils'

export function LocationsMap({ locations }: { locations: BusinessLocation[] }) {
  const [activeId, setActiveId] = useState(locations[0]?.id)
  const [copied, setCopied] = useState(false)
  const active = locations.find((l) => l.id === activeId) ?? locations[0]
  if (!active) return null

  const src = `https://maps.google.com/maps?q=${active.lat},${active.lng}&hl=ar&z=16&output=embed`

  async function copyAddress() {
    if (!active.shortAddress) return
    try {
      await navigator.clipboard.writeText(active.shortAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // تجاهل تعذّر النسخ التلقائي (يمكن للعميل نسخه يدويًا).
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="المواقع" className="flex flex-wrap gap-2">
        {locations.map((loc) => (
          <button
            key={loc.id}
            role="tab"
            type="button"
            aria-selected={loc.id === active.id}
            onClick={() => setActiveId(loc.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
              loc.id === active.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
            )}
          >
            <MapPin className="size-4" aria-hidden="true" />
            {loc.name}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-muted">
        <iframe
          key={active.id}
          title={`خريطة ${active.name}`}
          src={src}
          className="aspect-[4/3] w-full sm:aspect-[16/9]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{active.address}</p>
        <div className="flex flex-wrap items-center gap-2">
          {active.shortAddress && (
            <button
              type="button"
              onClick={copyAddress}
              title="نسخ العنوان الوطني المختصر"
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:border-primary"
            >
              {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? 'تم النسخ' : 'نسخ العنوان'}
              <span dir="ltr" className="font-mono text-xs font-semibold">
                {active.shortAddress}
              </span>
            </button>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${active.lat},${active.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80"
          >
            <Navigation className="size-4" aria-hidden="true" />
            الاتجاهات عبر خرائط جوجل
          </a>
        </div>
      </div>
    </div>
  )
}
