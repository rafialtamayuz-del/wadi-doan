'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'

declare global {
  interface Window {
    google?: any
    __gmapsLoading?: Promise<void>
  }
}

const MAPS_LIB = 'https://maps.googleapis.com/maps/api/js'

/** تحميل مكتبة خرائط جوجل في المتصفح مرة واحدة فقط (إذا توفر المفتاح). */
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'))
  if (window.google?.maps) return Promise.resolve()
  if (window.__gmapsLoading) return window.__gmapsLoading
  window.__gmapsLoading = new Promise<void>((resolve, reject) => {
    const cb = '__gmapsCb_' + Math.random().toString(36).slice(2)
    ;(window as any)[cb] = () => resolve()
    const s = document.createElement('script')
    s.src = `${MAPS_LIB}?key=${apiKey}&libraries=&callback=${cb}&language=ar&region=SA`
    s.async = true
    s.defer = true
    s.onerror = () => reject(new Error('load-failed'))
    document.head.appendChild(s)
  })
  return window.__gmapsLoading
}

interface LocationMapPickerProps {
  lat: number
  lng: number
  onPick: (lat: number, lng: number) => void
}

/**
 * خريطة تفاعلية تسمح بسحب الدبوس لتحديد الإحداثيات يدويًا.
 * إذا لم يكن مفتاح خرائط جوجل متاحًا على العميل، يعرض تضمين iframe كبديل.
 */
export function LocationMapPicker({ lat, lng, onPick }: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback' | 'error'>('loading')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const valid = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)

  useEffect(() => {
    if (!apiKey) {
      setStatus('fallback')
      return
    }
    let cancelled = false
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return
        const center = valid ? { lat, lng } : { lat: 23.8859, lng: 45.0792 }
        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: valid ? 16 : 6,
          mapTypeId: 'roadmap',
          fullscreenControl: false,
          streetViewControl: false,
        })
        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: true,
          title: 'اسحب الدبوس لتحديد الموقع',
        })
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (pos) onPickRef.current(Number(pos.lat().toFixed(7)), Number(pos.lng().toFixed(7)))
        })
        map.addListener('click', (e: any) => {
          const p = e.latLng
          marker.setPosition(p)
          onPickRef.current(Number(p.lat().toFixed(7)), Number(p.lng().toFixed(7)))
        })
        mapRef.current = map
        markerRef.current = marker
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('fallback')
      })
    return () => {
      cancelled = true
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null)
        } catch {
          /* ignore */
        }
      }
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  // تحديث موقع الدبوس عند تغيير الإحداثيات خارجيًا (استخراج تلقائي أو إدخال يدوي).
  useEffect(() => {
    if (status !== 'ready' || !markerRef.current || !mapRef.current || !valid) return
    const pos = { lat, lng }
    markerRef.current.setPosition(pos)
    mapRef.current.panTo(pos)
  }, [lat, lng, status, valid])

  if (status === 'loading') {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center gap-2 rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        جارٍ تحميل الخريطة...
      </div>
    )
  }

  if (status === 'fallback') {
    const embed = `https://maps.google.com/maps?q=${lat},${lng}&hl=ar&z=16&output=embed`
    return (
      <div className="overflow-hidden rounded-lg border bg-background">
        {valid ? (
          <iframe
            key={`${lat},${lng}`}
            title="خريطة الموقع"
            src={embed}
            className="aspect-[16/9] w-full"
            loading="lazy"
          />
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            أدخل الإحداثيات أو الصق رابط الموقع لعرض الخريطة.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div ref={containerRef} className="aspect-[16/9] w-full" />
      <p className="border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        <MapPin className="mr-1 inline size-3 align-text-bottom" aria-hidden="true" />
        اسحب الدبوس أو انقر على الخريطة لتحديث الإحداثيات فورًا.
      </p>
    </div>
  )
}
