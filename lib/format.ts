import type { MenuItem } from './types'

export const VAT_RATE = 0.15

export const round2 = (n: number) => Math.round(n * 100) / 100

export const effectivePrice = (item: Pick<MenuItem, 'price' | 'discount'>) =>
  round2(item.price * (1 - (item.discount || 0) / 100))

export const vatFromInclusive = (total: number) => round2(total - total / (1 + VAT_RATE))

const currency = new Intl.NumberFormat('ar-SA-u-nu-latn', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const sar = (n: number) => `${currency.format(n)} ر.س`

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'long' }).format(new Date(iso))

/** يهيئ رقم الجوال السعودي للاستخدام في روابط واتساب والرسائل النصية (9665xxxxxxxx). */
export function toInternationalPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('966')) return digits
  if (digits.startsWith('00966')) return digits.slice(2)
  if (digits.startsWith('0')) return `966${digits.slice(1)}`
  if (digits.length === 9 && digits.startsWith('5')) return `966${digits}`
  return digits
}

export function zatcaQrBase64(fields: {
  seller: string
  vatNumber: string
  timestamp: string
  total: number
  vat: number
}) {
  const encoder = new TextEncoder()
  const tlv = (tag: number, value: string) => {
    const bytes = encoder.encode(value)
    return [tag, bytes.length, ...bytes]
  }
  const bytes = [
    ...tlv(1, fields.seller),
    ...tlv(2, fields.vatNumber),
    ...tlv(3, fields.timestamp),
    ...tlv(4, fields.total.toFixed(2)),
    ...tlv(5, fields.vat.toFixed(2)),
  ]
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
