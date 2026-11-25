'use client'

import { QRCodeSVG } from 'qrcode.react'

/**
 * باركود خاص بالطلب يُطبع أسفل بون المطبخ؛ عند مسحه بكاميرا الجوال يفتح صفحة تُحدّث حالة الطلب إلى «جاهز».
 */
export function ReadyQr({ orderId, origin }: { orderId: string; origin: string }) {
  return (
    <div className="flex break-inside-avoid flex-col items-center gap-1 border-t-2 border-dashed border-foreground pt-3 text-center">
      <QRCodeSVG value={`${origin}/ready/${orderId}`} size={150} level="M" title="باركود تحديث حالة الطلب إلى جاهز" />
      <p className="text-xs font-bold leading-relaxed">امسح الباركود بكاميرا الجوال لتحديث حالة الطلب إلى «جاهز»</p>
      <p dir="ltr" className="font-mono text-[10px] text-muted-foreground">{origin}/ready/{orderId}</p>
    </div>
  )
}
