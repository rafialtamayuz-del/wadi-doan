'use client'

import { useEffect } from 'react'
import { useSettings } from '@/lib/client'

export function ThemeApplier() {
  const { data } = useSettings()

  useEffect(() => {
    if (!data) return
    const root = document.documentElement
    root.style.setProperty('--primary', data.primaryColor)
    root.style.setProperty('--sidebar-primary', data.primaryColor)
    root.style.setProperty('--chart-1', data.primaryColor)
    root.style.setProperty('--accent', data.accentColor)
    root.style.setProperty('--chart-2', data.accentColor)
  }, [data])

  return null
}
