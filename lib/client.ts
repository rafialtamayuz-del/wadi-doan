'use client'

import useSWR from 'swr'
import type { CollectionName, Order, Settings } from './types'

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('تعذّر تحميل البيانات')
  return res.json()
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
