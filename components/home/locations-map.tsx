'use client'

import { useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import type { BusinessLocation } from '@/lib/types'
import { cn } from '@/lib/utils'

export function LocationsMap({ locations }: { locations: BusinessLocation[] }) {
  const [activeId, setActiveId] = useState(locations[0]?.id)
  const active = locations.find((l) => l.id === activeId) ?? locations[0]
  if (!active) return null

  const d = 0.008
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${active.lng - d},${active.lat - d},${active.lng + d},${active.lat + d}&layer=mapnik&marker=${active.lat},${active.lng}`

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
  )
}
