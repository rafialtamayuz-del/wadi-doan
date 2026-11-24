import { NextResponse } from 'next/server'

/** صيغة العنوان الوطني المختصر: 4 حروف + 4 أرقام (مثال: RRRD2929). */
const SHORT_ADDRESS_RE = /^[A-Za-z]{4}\d{4}$/

type GoogleComponent = { long_name: string; short_name: string; types: string[] }

/**
 * تحويل العنوان الوطني المختصر إلى تفاصيل العنوان الكامل باستخدام خرائط جوجل (Geocoding API).
 * يعيد المدينة والحي والشارع والرمز البريدي والإحداثيات لتُعبّأ تلقائيًا في نموذج العنوان.
 */
export async function GET(req: Request) {
  const short = (new URL(req.url).searchParams.get('short') ?? '').trim().toUpperCase()
  if (!SHORT_ADDRESS_RE.test(short)) {
    return NextResponse.json({ error: 'صيغة العنوان الوطني المختصر غير صحيحة (4 حروف و4 أرقام)' }, { status: 400 })
  }

  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    // تدرّج لطيف: عند غياب المفتاح يبقى الإدخال اليدوي متاحًا دون تعطّل النموذج.
    return NextResponse.json(
      { error: 'خدمة خرائط جوجل غير مُفعّلة حاليًا، يمكنك إدخال تفاصيل العنوان يدويًا.' },
      { status: 503 },
    )
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', `${short}, السعودية`)
  url.searchParams.set('components', 'country:SA')
  url.searchParams.set('region', 'sa')
  url.searchParams.set('language', 'ar')
  url.searchParams.set('key', key)

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const data = (await res.json()) as {
      status?: string
      results?: { address_components: GoogleComponent[]; formatted_address: string; geometry: { location: { lat: number; lng: number } } }[]
    }
    if (data.status !== 'OK' || !data.results?.length) {
      return NextResponse.json({ error: 'لم يتم العثور على العنوان، تحقق من الرمز أو أدخله يدويًا' }, { status: 404 })
    }
    const result = data.results[0]
    const pick = (...types: string[]) =>
      result.address_components.find((c) => c.types.some((t) => types.includes(t)))?.long_name ?? ''

    return NextResponse.json({
      shortAddress: short,
      city: pick('locality', 'administrative_area_level_2', 'administrative_area_level_1'),
      district: pick('sublocality_level_1', 'sublocality', 'neighborhood'),
      street: pick('route'),
      postalCode: pick('postal_code'),
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      formatted: result.formatted_address,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
