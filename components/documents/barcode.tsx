import { code128Bars } from '@/lib/barcode'

/** باركود Code 128-B مرسوم كـ SVG (يقرأ رقم الخطاب وتاريخه). */
export function Barcode({
  value,
  height = 34,
  width,
  fluid = false,
  moduleWidth = 1.5,
  showValue = true,
  className,
}: {
  value: string
  height?: number
  /** عرض ثابت بالبكسل؛ يُحسب عرض الوحدة تلقائيًا ليلائم الملصق. */
  width?: number
  /** يتمدد الباركود بعرض الحاوية (عروض الأشرطة تبقى متناسبة). */
  fluid?: boolean
  moduleWidth?: number
  showValue?: boolean
  className?: string
}) {
  let widths: number[] = []
  try {
    widths = code128Bars(value)
  } catch {
    widths = []
  }
  if (!widths.length) return null

  const total = widths.reduce((sum, w) => sum + w, 0)
  // في الوضع المتمدد نثبّت وحدة الرسم ثم نمدّدها عبر CSS بعرض الحاوية.
  const unit = fluid ? 10 : width ? width / total : moduleWidth
  const svgWidth = total * unit
  const bars: { x: number; w: number }[] = []
  let x = 0
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w: w * unit })
    x += w * unit
  })

  return (
    <div className={className}>
      <svg
        width={fluid ? '100%' : svgWidth}
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio={fluid ? 'none' : undefined}
        role="img"
        aria-label={`باركود ${value}`}
        shapeRendering="crispEdges"
        className="block"
      >
        <rect x={0} y={0} width={svgWidth} height={height} fill="#ffffff" />
        {bars.map((bar, i) => (
          <rect key={i} x={bar.x} y={0} width={bar.w} height={height} fill="#111111" />
        ))}
      </svg>
      {showValue && (
        <p dir="ltr" className="mt-0.5 text-center font-mono text-[9px] tracking-widest text-neutral-600">
          {value}
        </p>
      )}
    </div>
  )
}
