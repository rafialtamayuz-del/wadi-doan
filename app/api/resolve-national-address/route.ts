import { NextResponse } from 'next/server'

/** صيغة العنوان الوطني المختصر: 4 حروف إنجليزية كبيرة + 4 أرقام (مثال: JEDA1234). */
const SHORT_ADDRESS_RE = /^[A-Za-z]{4}\d{4}$/

type SaudiAddress = {
  City?: string
  District?: string
  Street?: string
  PostCode?: string
  Latitude?: string
  Longitude?: string
  RegionName?: string
  Address1?: string
  Address2?: string
}

type SaudiResponse = {
  totalSearchResults?: string | number
  Addresses?: SaudiAddress[]
}

type GoogleComponent = { long_name: string; short_name: string; types: string[] }

/**
 * تحويل العنوان الوطني المختصر إلى تفاصيل العنوان الكامل والإحداثيات.
 * يحاول أولاً عبر Saudi Post National Address API (إذا توفر المفتاح)،
 * ثم يتراجع إلى Google Maps Geocoding API.
 */
export async function GET(req: Request) {
  const short = (new URL(req.url).searchParams.get('short') ?? '').trim().toUpperCase()
  if (!SHORT_ADDRESS_RE.test(short)) {
    return NextResponse.json(
      { error: 'صيغة العنوان الوطني المختصر غير صحيحة (4 حروف إنجليزية و4 أرقام)' },
      { status: 400 },
    )
  }

  const saudiKey = process.env.SAUDI_POST_API_KEY
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY

  // 1) محاولة Saudi Post National Address API أولاً.
  if (saudiKey) {
    try {
      const url = new URL(
        'https://apina.address.gov.sa/NationalAddress/NationalAddressByShortAddress/NationalAddressByShortAddress',
      )
      url.searchParams.set('language', 'A')
      url.searchParams.set('format', 'JSON')
      url.searchParams.set('shortaddress', short)
      url.searchParams.set('api_key', saudiKey)

      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json()) as SaudiResponse
        const addr = data.Addresses?.[0]
        const total = Number(data.totalSearchResults ?? 0)
        if (addr && total > 0) {
          const lat = Number(addr.Latitude)
          const lng = Number(addr.Longitude)
          return NextResponse.json({
            shortAddress: short,
            city: addr.City ?? '',
            district: addr.District ?? '',
            street: addr.Street ?? '',
            postalCode: addr.PostCode ?? '',
            lat: Number.isFinite(lat) ? lat : null,
            lng: Number.isFinite(lng) ? lng : null,
            formatted: [addr.Address1, addr.Address2].filter(Boolean).join('، '),
            source: 'saudi-post',
          })
        }
      }
    } catch {
      // تجاهل فشل Saudi Post والمضيء إلى Google كخيار ثانٍ.
    }
  }

  // 2) تراجع إلى Google Maps Geocoding API.
  if (googleKey) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
      url.searchParams.set('address', `${short}, السعودية`)
      url.searchParams.set('components', 'country:SA')
      url.searchParams.set('region', 'sa')
      url.searchParams.set('language', 'ar')
      url.searchParams.set('key', googleKey)

      const res = await fetch(url, { cache: 'no-store' })
      const data = (await res.json()) as {
        status?: string
        results?: {
          address_components: GoogleComponent[]
          formatted_address: string
          geometry: { location: { lat: number; lng: number } }
        }[]
      }
      if (data.status === 'OK' && data.results?.length) {
        const result = data.results[0]
        const pick = (...types: string[]) =>
          result.address_components.find((c) => c.types.some((t) => types.includes(t)))?.long_name ?? ''
        return NextResponse.json({
          shortAddress: short,
          city: pick('locality', 'administrative_area_level_2', 'administrative_area_level_1'),
          district: pick('sublocality_level_1', 'sublocality', 'neighborhood'),
          street: pick('route'),
          postalCode: pick('postal_code'),
          lat: result.geometry?.location?.lat ?? null,
          lng: result.geometry?.location?.lng ?? null,
          formatted: result.formatted_address,
          source: 'google',
        })
      }
      return NextResponse.json(
        { error: 'لم يتم العثور على العنوان، تحقق من الرمز أو أدخله يدويًا' },
        { status: 404 },
      )
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 })
    }
  }

  return NextResponse.json(
    { error: 'خدمة استخراج العنوان غير مُفعّلة حاليًا (لم يتم تعيين مفتاح Saudi Post أو Google Maps).' },
    { status: 503 },
  )
}
