'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import useSWR from 'swr'
import { supabaseBrowser } from './supabase/browser'
import type { CollectionName, Order, Settings } from './types'

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error || 'تعذّر تحميل البيانات')
  return data as T
}

/** يعيد مستخدم Supabase الحالي (لقراءة الدور والصلاحيات في الواجهة). */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setReady(true)
      return
    }
    const supabase = supabaseBrowser()
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return { user, ready }
}

export function useSettings() {
  return useSWR<Settings>('/api/settings', fetcher)
}

export function useCollection<T>(name: CollectionName, refreshInterval?: number) {
  return useSWR<T[]>(`/api/db/${name}`, fetcher, { refreshInterval })
}

export function useOrders(refreshInterval?: number) {
  return useSWR<Order[]>('/api/orders', fetcher, { refreshInterval })
}

export async function apiSend<T = unknown>(url: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || 'حدث خطأ غير متوقع')
  return data as T
}

export function fileToDataUrl(file: File, maxMB = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxMB * 1024 * 1024) {
      reject(new Error(`حجم الملف يجب ألا يتجاوز ${maxMB} ميجابايت`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('تعذّرت قراءة الملف'))
    reader.readAsDataURL(file)
  })
}
