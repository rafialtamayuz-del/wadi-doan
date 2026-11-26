'use client'

import { QRCodeSVG } from 'qrcode.react'

export function QrBlock({ value }: { value: string }) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <QRCodeSVG value={value} size={128} level="M" title="رمز الفاتورة الإلكترونية" />
      <figcaption className="text-[10px] text-muted-foreground">رمز متوافق مع هيئة الزكاة والضريبة والجمارك</figcaption>
    </figure>
  )
}
