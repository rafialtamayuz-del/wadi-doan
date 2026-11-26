import type { Settings } from '@/lib/types'

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-10 text-sm md:flex-row md:items-center md:justify-between">
        <p className="font-heading text-lg font-bold">{settings.name}</p>
        <p className="opacity-80">
          سجل تجاري: {settings.crNumber} · الرقم الضريبي: {settings.vatNumber}
        </p>
        <p className="opacity-70">
          {settings.city}، {settings.district} · جميع الحقوق محفوظة {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
