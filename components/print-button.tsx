'use client'

import { useEffect } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton({ label = 'طباعة', auto = false }: { label?: string; auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [auto])

  return (
    <Button size="lg" className="print:hidden" onClick={() => window.print()}>
      <Printer aria-hidden="true" />
      {label}
    </Button>
  )
}
