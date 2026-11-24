import { findOrderByNumberAndPhone, listComplaintsByPhone } from '@/lib/data'

const digits = (s: string) => s.replace(/\D/g, '').slice(-9)

/** تتبّع الطلب متاح للعملاء بدون تسجيل الدخول عبر رقم الطلب ورقم الجوال. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const number = Number(url.searchParams.get('number'))
  const phone = digits(url.searchParams.get('phone') ?? '')
  if (phone.length < 9) return Response.json({ error: 'رقم الجوال غير صحيح' }, { status: 400 })

  try {
    const order = Number.isInteger(number) && number > 0 ? await findOrderByNumberAndPhone(number, phone) : null
    const complaints = await listComplaintsByPhone(phone)
    return Response.json({
      order: order ? { ...order, payment: { ...order.payment, receipt: undefined } } : null,
      complaints,
    })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
