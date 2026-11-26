import { MessageCircle } from 'lucide-react'

export function WhatsappFab({ number, name }: { number: string; name: string }) {
  const text = encodeURIComponent(`السلام عليكم، أرغب بالاستفسار عن خدمات ${name}`)
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-[#1f9d55] px-4 py-3 font-medium text-white shadow-lg transition hover:bg-[#188a4a] focus-visible:ring-3 focus-visible:ring-[#1f9d55]/40 print:hidden"
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      <span>واتساب</span>
    </a>
  )
}
