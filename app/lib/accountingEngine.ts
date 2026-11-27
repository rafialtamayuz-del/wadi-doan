import { supabaseServer } from '@/lib/supabase/server'
import type { CompanyInvoice, Order } from '@/lib/types'

/** أنواع المعاملات المالية المسجّلة في دفتر الأستاذ. */
export type TransactionType = 'sale' | 'purchase' | 'expense'
/** مصدر المعاملة: طلب مطعم/مطبخ، فاتورة شركة، أو إدخال يدوي. */
export type TransactionSource = 'order' | 'invoice' | 'manual'

export interface SaleTransactionInput {
  /** المصدر: طلب (order) أو فاتورة شركة (invoice). */
  source: TransactionSource
  /** معرّف المصدر (رقم الطلب أو معرّف الفاتورة). */
  sourceId: string
  /** المبلغ الإجمالي شامل الضريبة. */
  amount: number
  /** ضريبة القيمة المضافة. */
  vat: number
  /** المبلغ قبل الضريبة (يُحسب تلقائيًا إن لم يُوفَّر. */
  net?: number
  /** وصف مختصر للمعاملة. */
  description?: string
  /** بيانات إضافية (نوع الطلب، رقم الطاولة، اسم العميل، إلخ). */
  metadata?: Record<string, unknown>
}

export interface TransactionRow {
  id: string
  createdAt: string
  type: TransactionType
  source: TransactionSource
  sourceId: string | null
  amount: number
  vat: number
  net: number
  description: string | null
  metadata: Record<string, unknown>
}

/**
 * تسجيل معاملة مبيعات في دفتر الأستاذ.
 * تُستخدم هذه الدالة عند إنشاء طلب مدفوع أو تأكيد دفع طلب أو حفظ فاتورة شركة.
 */
export async function recordSaleTransaction(input: SaleTransactionInput): Promise<TransactionRow> {
  const supabase = await supabaseServer()
  const net = input.net ?? Math.max(0, input.amount - input.vat)
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type: 'sale',
      source: input.source,
      source_id: input.sourceId,
      amount: input.amount,
      vat: input.vat,
      net,
      description: input.description ?? '',
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return toTransaction(data)
}

/** تسجيل معاملة مبيعات من طلب مطعم/مطبخ. */
export async function recordOrderSale(order: Pick<Order, 'id' | 'number' | 'total' | 'vat' | 'type' | 'table' | 'customerName'>): Promise<TransactionRow> {
  return recordSaleTransaction({
    source: 'order',
    sourceId: order.id,
    amount: order.total,
    vat: order.vat,
    description: `طلب #${order.number}`,
    metadata: {
      orderNumber: order.number, type: order.type, table: order.table ?? null, customerName: order.customerName ?? null },
  })
}

/** تسجيل معاملة مبيعات من فاتورة شركة (B2B). */
export async function recordInvoiceSale(invoice: Pick<CompanyInvoice, 'id' | 'number' | 'buyerName'>, total: number, vat: number): Promise<TransactionRow> {
  return recordSaleTransaction({
    source: 'invoice',
    sourceId: invoice.id,
    amount: total,
    vat,
    description: `فاتورة شركة ${invoice.number} - ${invoice.buyerName}`,
    metadata: { invoiceNumber: invoice.number, buyerName: invoice.buyerName },
  })
}

/** جلب جميع المعاملات المالية (للعرض في تقارير المدير المالي الذكي). */
export async function listTransactions(): Promise<TransactionRow[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map(toTransaction)
}

/** ملخص مالي سريع من المعاملات لإطعام نموذج Gemini في المدير المالي الذكي. */
export async function getFinancialSummary(): Promise<{
  totalRevenue: number
  totalVat: number
  totalNet: number
  count: number
  bySource: Record<string, { count: number; amount: number }>
}> {
  const rows = await listTransactions()
  const bySource: Record<string, { count: number; amount: number }> = {}
  let totalRevenue = 0
  let totalVat = 0
  let totalNet = 0
  for (const r of rows) {
    totalRevenue += r.amount
    totalVat += r.vat
    totalNet += r.net
    const key = r.source
    if (!bySource[key]) bySource[key] = { count: 0, amount: 0 }
    bySource[key].count += 1
    bySource[key].amount += r.amount
  }
  return { totalRevenue, totalVat, totalNet, count: rows.length, bySource }
}

function toTransaction(r: Record<string, unknown>): TransactionRow {
  return {
    id: String(r.id),
    createdAt: String(r.created_at),
    type: (r.type as TransactionType) ?? 'sale',
    source: (r.source as TransactionSource) ?? 'order',
    sourceId: r.source_id ? String(r.source_id) : null,
    amount: Number(r.amount),
    vat: Number(r.vat),
    net: Number(r.net),
    description: r.description ? String(r.description) : null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
  }
}
