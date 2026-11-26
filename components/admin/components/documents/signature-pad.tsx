'use client'

import type * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * لوحة توقيع إلكتروني تدعم اللمس والماوس.
 * ترسم على Canvas وتُرجع التوقيع كصورة Data URL عبر onChange،
 * وعند تمرير قيمة محفوظة (value) تُعاد رسمها تلقائيًا في اللوحة.
 */
export function SignaturePad({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (dataUrl: string) => void
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const rendered = useRef('')
  const [hasInk, setHasInk] = useState(Boolean(value))

  /** يجهّز أبعاد اللوحة حسب كثافة بكسل الجهاز ويضبط إعدادات الخط. */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(rect.width * ratio))
    canvas.height = Math.max(1, Math.round(rect.height * ratio))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }, [])

  /** يرسم التوقيع المحفوظ (عند تحميله من ملف المستخدم) داخل اللوحة. */
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (!value) {
      // مسح اللوحة عند إفراغ التوقيع.
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
      rendered.current = ''
      setHasInk(false)
      return
    }
    if (value === rendered.current) return
    const image = new Image()
    image.onload = () => {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      ctx.restore()
      rendered.current = value
      setHasInk(true)
    }
    image.src = value
  }, [value])

  function pointOf(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    lastPoint.current = pointOf(event)
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !lastPoint.current) return
    const next = pointOf(event)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(next.x, next.y)
    ctx.stroke()
    lastPoint.current = next
  }

  function end() {
    if (!drawing.current) return
    drawing.current = false
    lastPoint.current = null
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    rendered.current = dataUrl
    setHasInk(true)
    onChange(dataUrl)
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }
    rendered.current = ''
    setHasInk(false)
    onChange('')
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative overflow-hidden rounded-lg border border-dashed border-input bg-white">
        <canvas
          ref={canvasRef}
          className="h-32 w-full touch-none cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-neutral-400">
            وقّع هنا بإصبعك أو بالماوس
          </span>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={clear} disabled={!hasInk} className="self-start">
        <Eraser aria-hidden="true" />
        مسح التوقيع
      </Button>
    </div>
  )
}
