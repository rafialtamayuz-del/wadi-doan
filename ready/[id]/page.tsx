import type { Metadata } from 'next'
import { ReadyMarker } from '@/components/kitchen/ready-marker'

export const metadata: Metadata = { title: 'تحديث حالة الطلب', robots: { index: false } }

export default async function ReadyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <ReadyMarker orderId={id} />
    </main>
  )
}
