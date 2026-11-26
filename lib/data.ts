import { supabaseServer } from './supabase/server'
import {
  type CollectionName,
  type CompanyInvoice,
  type Complaint,
  type FinancialReport,
  type Letter,
  type MenuItem,
  type Order,
  type Purchase,
  type Settings,
  type Zone,
} from './types'

type Row = Record<string, any>

export const SETTINGS_ID = 1

/** جداول Supabase المقابلة للمجموعات القابلة للتعديل من لوحة التحكم. */
const TABLES = {
  menu: 'menu_items',
  complaints: 'complaints',
  purchases: 'purchases',
  letters: 'official_documents',
  reports: 'financial_reports',
  invoices: 'company_invoices',
} as const

type TableCollection = keyof typeof TABLES

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** الإعدادات الافتراضية تُستخدم عند عدم وجود صف في جدول settings. */
export const DEFAULT_SETTINGS: Settings = {
  name: 'مطاعم ومطابخ وادي دوعن',
  tagline: 'أصالة المذاق الحضرمي في كل طبق',
  about:
    'مطاعم ومطابخ وادي دوعن وجهتكم للمأكولات الحضرمية الأصيلة. نقدّم المندي والحنيذ والمضغوط يوميًا، ونجهّز الذبائح والولائم للمناسبات والأفراح، ونوفّر وجبات الإعاشة للشركات والمؤسسات، وسفرة إفطار صائم في رمضان، بأيدي طهاة متخصصين ومطبخ مركزي مجهز بأعلى معايير النظافة والجودة.',
  logo: '/images/logo.png',
  primaryColor: '#8a3b1f',
  accentColor: '#e9b44c',
  phone: '0122345678',
  phone2: '0551234567',
  whatsapp: '966551234567',
  email: 'info@wadidoan.sa',
  city: 'جدة',
  district: 'حي النسيم',
  shortAddress: '',
  vatNumber: '310123456700003',
  crNumber: '1010123456',
  hours: [
    { label: 'المطعم (يوميًا)', time: '11:00 ص - 1:00 ص' },
    { label: 'المطبخ المركزي', time: '6:00 ص - 11:00 م' },
    { label: 'الجمعة', time: '1:30 م - 1:00 ص' },
  ],
  locations: [
    { id: 'branch', name: 'الفرع الرئيسي', address: 'جدة، حي النسيم، شارع الأمير سلطان', shortAddress: '', city: 'جدة', district: 'حي النسيم', street: 'شارع الأمير سلطان', postalCode: '', lat: 21.5422, lng: 39.173 },
    { id: 'kitchen', name: 'المطبخ المركزي', address: 'جدة، المدينة الصناعية، طريق المدينة', shortAddress: '', city: 'جدة', district: 'المدينة الصناعية', street: 'طريق المدينة', postalCode: '', lat: 21.581, lng: 39.166 },
  ],
  gateways: { mada: true, applepay: true, visa: true, tabby: true, tamara: true, pos: true, cash: true, bank: true },
  zones: [
    { id: 'zone-1', name: 'حي النسيم', fee: 10, active: true, createdAt: '' },
    { id: 'zone-2', name: 'حي الروضة', fee: 15, active: true, createdAt: '' },
    { id: 'zone-3', name: 'حي السلامة', fee: 15, active: true, createdAt: '' },
    { id: 'zone-4', name: 'حي الشاطئ', fee: 20, active: true, createdAt: '' },
    { id: 'zone-5', name: 'حي الحمراء', fee: 25, active: true, createdAt: '' },
  ],
  accounts: [],
}

/* ---------------------------------- Mappers --------------------------------- */

function toMenuItem(r: Row): MenuItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description ?? '',
    ingredients: r.ingredients ?? '',
    price: Number(r.price ?? 0),
    discount: Number(r.discount ?? 0),
    image: r.image ?? '',
    allergens: Array.isArray(r.allergens) ? r.allergens : [],
    stock: r.stock ?? null,
    active: r.active ?? true,
    menuSection: r.menu_section === 'kitchen' || r.menu_section === 'both' ? r.menu_section : 'restaurant',
    createdAt: r.created_at,
  }
}

function menuToRow(m: Partial<MenuItem>): Row {
  const r: Row = {}
  if (m.name !== undefined) r.name = m.name
  if (m.category !== undefined) r.category = m.category
  if (m.description !== undefined) r.description = m.description
  if (m.ingredients !== undefined) r.ingredients = m.ingredients
  if (m.price !== undefined) r.price = m.price
  if (m.discount !== undefined) r.discount = m.discount
  if (m.image !== undefined) r.image = m.image
  if (m.allergens !== undefined) r.allergens = m.allergens
  if (m.stock !== undefined) r.stock = m.stock
  if (m.active !== undefined) r.active = m.active
  if (m.menuSection !== undefined && ['restaurant', 'kitchen', 'both'].includes(m.menuSection)) {
    r.menu_section = m.menuSection
  }
  return r
}

function toComplaint(r: Row): Complaint {
  return {
    id: r.id,
    createdAt: r.created_at,
    type: r.type === 'suggestion' ? 'suggestion' : 'complaint',
    orderNumber: r.order_number ?? undefined,
    name: r.name,
    phone: r.phone,
    message: r.message,
    reply: r.reply ?? '',
    status: r.status,
  }
}

function complaintToRow(c: Partial<Complaint>): Row {
  const r: Row = {}
  if (c.type !== undefined) r.type = c.type
  if (c.orderNumber !== undefined) r.order_number = c.orderNumber
  if (c.name !== undefined) r.name = c.name
  if (c.phone !== undefined) r.phone = c.phone
  if (c.message !== undefined) r.message = c.message
  if (c.reply !== undefined) r.reply = c.reply
  if (c.status !== undefined) r.status = c.status
  return r
}

function toPurchase(r: Row): Purchase {
  return {
    id: r.id,
    createdAt: r.created_at,
    supplier: r.supplier,
    invoiceNo: r.invoice_no ?? '',
    date: r.invoice_date ?? '',
    amount: Number(r.amount ?? 0),
    lines: Array.isArray(r.lines) ? r.lines : [],
    image: r.image ?? undefined,
    notes: r.notes ?? undefined,
  }
}

function purchaseToRow(p: Partial<Purchase>): Row {
  const r: Row = {}
  if (p.supplier !== undefined) r.supplier = p.supplier
  if (p.invoiceNo !== undefined) r.invoice_no = p.invoiceNo
  if (p.date !== undefined) r.invoice_date = p.date || null
  if (p.amount !== undefined) r.amount = p.amount
  if (p.lines !== undefined) r.lines = p.lines
  if (p.image !== undefined) r.image = p.image || null
  if (p.notes !== undefined) r.notes = p.notes || null
  return r
}

function toLetter(r: Row): Letter {
  return {
    id: r.id,
    createdAt: r.created_at,
    type: r.type,
    number: r.doc_number ?? '',
    title: r.title ?? '',
    recipient: r.recipient ?? '',
    recipientTitle: r.recipient_title ?? 'الموقر',
    date: r.doc_date ?? '',
    attachments: r.attachments ?? '',
    body: r.body ?? '',
    signerRole: r.signer_role ?? '',
    signerName: r.signer_name ?? '',
    signature: r.signature ?? '',
    isTemplate: r.is_template ?? false,
    sentVia: r.sent_via ?? undefined,
    sentAt: r.sent_at ?? undefined,
  }
}

function letterToRow(l: Partial<Letter>): Row {
  const r: Row = {}
  if (l.type !== undefined) r.type = l.type
  if (l.number !== undefined) r.doc_number = l.number || null
  if (l.title !== undefined) r.title = l.title
  if (l.recipient !== undefined) r.recipient = l.recipient
  if (l.recipientTitle !== undefined) r.recipient_title = l.recipientTitle
  if (l.date !== undefined) r.doc_date = l.date || null
  if (l.attachments !== undefined) r.attachments = l.attachments
  if (l.body !== undefined) r.body = l.body
  if (l.signerRole !== undefined) r.signer_role = l.signerRole
  if (l.signerName !== undefined) r.signer_name = l.signerName
  if (l.signature !== undefined) r.signature = l.signature
  if (l.isTemplate !== undefined) r.is_template = l.isTemplate
  if (l.sentVia !== undefined) r.sent_via = l.sentVia
  if (l.sentAt !== undefined) r.sent_at = l.sentAt || null
  return r
}

function toReport(r: Row): FinancialReport {
  return {
    id: r.id,
    createdAt: r.created_at,
    period: r.period === 'annual' ? 'annual' : 'monthly',
    year: Number(r.year ?? 0),
    month: r.month != null ? Number(r.month) : undefined,
    label: r.label ?? '',
    revenue: Number(r.revenue ?? 0),
    purchases: Number(r.purchases ?? 0),
    expenses: Number(r.expenses ?? 0),
    netProfit: Number(r.net_profit ?? 0),
    ordersCount: Number(r.orders_count ?? 0),
    notes: r.notes ?? undefined,
  }
}

function reportToRow(x: Partial<FinancialReport>): Row {
  const r: Row = {}
  if (x.period !== undefined) r.period = x.period
  if (x.year !== undefined) r.year = x.year
  if (x.month !== undefined) r.month = x.month ?? null
  if (x.label !== undefined) r.label = x.label
  if (x.revenue !== undefined) r.revenue = x.revenue
  if (x.purchases !== undefined) r.purchases = x.purchases
  if (x.expenses !== undefined) r.expenses = x.expenses
  if (x.netProfit !== undefined) r.net_profit = x.netProfit
  if (x.ordersCount !== undefined) r.orders_count = x.ordersCount
  if (x.notes !== undefined) r.notes = x.notes || null
  return r
}

function toInvoice(r: Row): CompanyInvoice {
  return {
    id: r.id,
    createdAt: r.created_at,
    number: r.number ?? '',
    date: r.invoice_date ?? '',
    buyerName: r.buyer_name ?? '',
    buyerAddress: r.buyer_address ?? '',
    buyerCr: r.buyer_cr ?? '',
    buyerVat: r.buyer_vat ?? undefined,
    lines: Array.isArray(r.lines) ? r.lines : [],
    notes: r.notes ?? undefined,
  }
}

function invoiceToRow(x: Partial<CompanyInvoice>): Row {
  const r: Row = {}
  if (x.number !== undefined) r.number = x.number
  if (x.date !== undefined) r.invoice_date = x.date || null
  if (x.buyerName !== undefined) r.buyer_name = x.buyerName
  if (x.buyerAddress !== undefined) r.buyer_address = x.buyerAddress
  if (x.buyerCr !== undefined) r.buyer_cr = x.buyerCr
  if (x.buyerVat !== undefined) r.buyer_vat = x.buyerVat || null
  if (x.lines !== undefined) r.lines = x.lines
  if (x.notes !== undefined) r.notes = x.notes || null
  return r
}

function toOrder(r: Row): Order {
  return {
    id: r.id,
    number: Number(r.number),
    createdAt: r.created_at,
    type: r.type,
    table: r.table_label ?? undefined,
    zoneId: r.zone_id ?? undefined,
    zoneName: r.zone_name ?? undefined,
    address: r.address ?? undefined,
    shortAddress: r.short_address ?? undefined,
    lat: r.lat != null ? Number(r.lat) : undefined,
    lng: r.lng != null ? Number(r.lng) : undefined,
    pickupFrom: r.pickup_from ?? undefined,
    customerName: r.customer_name,
    phone: r.phone,
    scheduledAt: r.scheduled_at ?? undefined,
    guests: r.guests ?? undefined,
    notes: r.notes ?? undefined,
    lines: Array.isArray(r.lines) ? r.lines : [],
    subtotal: Number(r.subtotal ?? 0),
    deliveryFee: Number(r.delivery_fee ?? 0),
    total: Number(r.total ?? 0),
    vat: Number(r.vat ?? 0),
    isBooking: Boolean(r.is_booking),
    priority: r.priority ?? 'normal',
    payment: r.payment ?? { method: 'pos', status: 'pending' },
    status: r.status,
    history: Array.isArray(r.history) ? r.history : [],
    pickupCode: r.pickup_code ?? undefined,
  }
}

export type NewOrder = Omit<Order, 'id' | 'number' | 'createdAt'>

function orderToRow(o: NewOrder): Row {
  return {
    type: o.type,
    table_label: o.table ?? null,
    zone_id: o.zoneId ?? null,
    zone_name: o.zoneName ?? null,
    address: o.address ?? null,
    short_address: o.shortAddress ?? null,
    lat: o.lat ?? null,
    lng: o.lng ?? null,
    pickup_from: o.pickupFrom ?? null,
    customer_name: o.customerName,
    phone: o.phone,
    scheduled_at: o.scheduledAt ?? null,
    guests: o.guests ?? null,
    notes: o.notes ?? null,
    lines: o.lines,
    subtotal: o.subtotal,
    delivery_fee: o.deliveryFee,
    total: o.total,
    vat: o.vat,
    is_booking: o.isBooking,
    priority: o.priority,
    payment: o.payment,
    status: o.status,
    history: o.history,
  }
}

function settingsToRow(s: Partial<Settings>): Row {
  const r: Row = {}
  if (s.name !== undefined) r.name = s.name
  if (s.tagline !== undefined) r.tagline = s.tagline
  if (s.about !== undefined) r.about = s.about
  if (s.logo !== undefined) r.logo = s.logo
  if (s.primaryColor !== undefined) r.primary_color = s.primaryColor
  if (s.accentColor !== undefined) r.accent_color = s.accentColor
  if (s.phone !== undefined) r.phone = s.phone
  if (s.phone2 !== undefined) r.phone2 = s.phone2
  if (s.whatsapp !== undefined) r.whatsapp = s.whatsapp
  if (s.email !== undefined) r.email = s.email
  if (s.city !== undefined) r.city = s.city
  if (s.district !== undefined) r.district = s.district
  if (s.shortAddress !== undefined) r.short_address = s.shortAddress
  if (s.vatNumber !== undefined) r.vat_number = s.vatNumber
  if (s.crNumber !== undefined) r.cr_number = s.crNumber
  if (s.hours !== undefined) r.hours = s.hours
  if (s.locations !== undefined) r.locations = s.locations
  if (s.gateways !== undefined) r.gateways = s.gateways
  if (s.zones !== undefined) r.zones = s.zones
  if (s.accounts !== undefined) r.accounts = s.accounts
  return r
}

function rowToSettings(r: Row): Settings {
  const d = DEFAULT_SETTINGS
  return {
    name: r.name ?? d.name,
    tagline: r.tagline ?? d.tagline,
    about: r.about ?? d.about,
    logo: r.logo ?? d.logo,
    primaryColor: r.primary_color ?? d.primaryColor,
    accentColor: r.accent_color ?? d.accentColor,
    phone: r.phone ?? d.phone,
    phone2: r.phone2 ?? d.phone2,
    whatsapp: r.whatsapp ?? d.whatsapp,
    email: r.email ?? d.email,
    city: r.city ?? d.city,
    district: r.district ?? d.district,
    shortAddress: r.short_address ?? d.shortAddress,
    vatNumber: r.vat_number ?? d.vatNumber,
    crNumber: r.cr_number ?? d.crNumber,
    hours: Array.isArray(r.hours) ? r.hours : d.hours,
    locations: Array.isArray(r.locations) ? r.locations : d.locations,
    // دمج البوابات مع الافتراضية لتفعيل أي طريقة دفع جديدة (مثل الدفع كاش) افتراضيًا.
    gateways: { ...d.gateways, ...(r.gateways ?? {}) },
    zones: Array.isArray(r.zones) ? r.zones : d.zones,
    accounts: Array.isArray(r.accounts) ? r.accounts : d.accounts,
  }
}

function mapperFor(name: TableCollection) {
  return {
    menu: toMenuItem,
    complaints: toComplaint,
    purchases: toPurchase,
    letters: toLetter,
    reports: toReport,
    invoices: toInvoice,
  }[name]
}

function toRowFor(name: TableCollection, body: Row): Row {
  switch (name) {
    case 'menu':
      return menuToRow(body as Partial<MenuItem>)
    case 'complaints':
      return complaintToRow(body as Partial<Complaint>)
    case 'purchases':
      return purchaseToRow(body as Partial<Purchase>)
    case 'letters':
      return letterToRow(body as Partial<Letter>)
    case 'reports':
      return reportToRow(body as Partial<FinancialReport>)
    case 'invoices':
      return invoiceToRow(body as Partial<CompanyInvoice>)
  }
}

/* --------------------------------- Settings -------------------------------- */

export async function getSettings(): Promise<Settings> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from('settings').select('*').eq('id', SETTINGS_ID).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return DEFAULT_SETTINGS
  return rowToSettings(data)
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = {
    ...current,
    ...patch,
    gateways: { ...current.gateways, ...(patch.gateways ?? {}) },
  }
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('settings')
    .upsert({ id: SETTINGS_ID, ...settingsToRow(next), updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return rowToSettings(data)
}

/* ------------------------------- Collections ------------------------------- */

export async function listRecords(name: CollectionName): Promise<unknown[]> {
  if (name === 'zones') return (await getSettings()).zones
  if (name === 'accounts') return (await getSettings()).accounts
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from(TABLES[name])
    .select('*')
    .order('created_at', { ascending: name === 'menu' })
  if (error) throw new Error(error.message)
  const mapper = mapperFor(name as TableCollection)
  return (data ?? []).map(mapper)
}

export const getMenuItems = async (): Promise<MenuItem[]> => (await listRecords('menu')) as MenuItem[]
export const getZones = async (): Promise<Zone[]> => (await getSettings()).zones

function upsertSettingsItem(name: 'zones' | 'accounts', id: string | null, body: Row) {
  return (async () => {
    const current = await getSettings()
    const list = [...current[name]] as Row[]
    if (id) {
      const index = list.findIndex((x) => x.id === id)
      const updated = { ...(index >= 0 ? list[index] : {}), ...body, id }
      if (index >= 0) list[index] = updated
      else list.push(updated)
      await saveSettings({ [name]: list } as Partial<Settings>)
      return updated
    }
    const record = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    await saveSettings({ [name]: [record, ...list] } as Partial<Settings>)
    return record
  })()
}

export async function createRecord(name: CollectionName, body: Row): Promise<unknown> {
  if (name === 'zones' || name === 'accounts') return upsertSettingsItem(name, null, body)
  if (name === 'complaints') {
    // إرسال الشكاوى/المقترحات متاح للعملاء عبر دالة آمنة (بدون منحهم صلاحية على الجدول).
    const supabase = await supabaseServer()
    const { data, error } = await supabase.rpc('create_complaint', {
      p_name: body.name,
      p_phone: body.phone,
      p_message: body.message,
      p_order_number: body.orderNumber ?? '',
      p_type: body.type === 'suggestion' ? 'suggestion' : 'complaint',
    })
    if (error) throw new Error(error.message)
    return toComplaint(data)
  }
  const supabase = await supabaseServer()
  const row = toRowFor(name, body)
  // الخطابات: يُولَّد رقم الخطاب إلكترونيًا وبشكل تسلسلي سنوي عند غيابه.
  if (name === 'letters' && !row.doc_number) {
    const { data: generated, error: numberError } = await supabase.rpc('next_document_number', {
      p_year: yearFromDate(body.date),
    })
    if (numberError) throw new Error(numberError.message)
    row.doc_number = generated
  }
  const { data, error } = await supabase.from(TABLES[name]).insert(row).select('*').single()
  if (error) throw new Error(error.message)
  return mapperFor(name)(data)
}

/** يعيد رقم الخطاب التالي المتوقع دون حجزه (لمعاينته قبل الحفظ). */
export async function peekNextLetterNumber(date?: string): Promise<string> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('peek_document_number', { p_year: yearFromDate(date) })
  if (error) throw new Error(error.message)
  return data as string
}

/** يستخرج السنة من تاريخ بصيغة YYYY-MM-DD، أو null لاستخدام السنة الحالية. */
function yearFromDate(value: unknown): number | null {
  const text = String(value ?? '')
  return /^\d{4}/.test(text) ? Number(text.slice(0, 4)) : null
}

export async function updateRecord(name: CollectionName, id: string, patch: Row): Promise<unknown> {
  if (name === 'zones' || name === 'accounts') return upsertSettingsItem(name, id, patch)
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from(TABLES[name]).update(toRowFor(name, patch)).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return mapperFor(name)(data)
}

export async function deleteRecord(name: CollectionName, id: string): Promise<void> {
  if (name === 'zones' || name === 'accounts') {
    const current = await getSettings()
    await saveSettings({ [name]: current[name].filter((x) => x.id !== id) } as Partial<Settings>)
    return
  }
  const supabase = await supabaseServer()
  const { error } = await supabase.from(TABLES[name]).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ---------------------------------- Orders --------------------------------- */

export async function listOrders(): Promise<Order[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toOrder)
}

export async function getOrder(id: string): Promise<Order | null> {
  // قراءة طلب واحد بمعرّفه عبر دالة آمنة (تُستخدم في صفحة الفاتورة/البون للعميل).
  if (!UUID_RE.test(id)) return null
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('get_order', { p_id: id })
  if (error) throw new Error(error.message)
  return data ? toOrder(data) : null
}

export async function insertOrder(order: NewOrder): Promise<Order> {
  // الإنشاء متاح للعملاء عبر دالة آمنة تعيد صف الطلب كاملاً (رقم الطلب والمعرّف).
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('create_order', { payload: orderToRow(order) })
  if (error) throw new Error(error.message)
  return toOrder(data)
}

export async function updateOrder(
  id: string,
  patch: { status?: Order['status']; priority?: Order['priority']; paymentStatus?: Order['payment']['status'] },
): Promise<Order | null> {
  const supabase = await supabaseServer()
  const { data: current, error: readError } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
  if (readError) throw new Error(readError.message)
  if (!current) return null
  const order = toOrder(current)

  // تأكيد الدفع يتم عبر دالة آمنة تولّد كود الاستلام للطلبات الإلكترونية، ثم نحفظ بقية التعديلات.
  if (patch.paymentStatus === 'paid') {
    const { data: confirmed, error: confirmError } = await supabase.rpc('confirm_order_payment', { p_id: id })
    if (confirmError) throw new Error(confirmError.message)
    if (!confirmed) return null
    Object.assign(order, toOrder(confirmed))
  } else if (patch.paymentStatus) {
    order.payment = { ...order.payment, status: patch.paymentStatus }
  }

  if (patch.status && patch.status !== order.status) {
    order.status = patch.status
    order.history = [...order.history, { status: patch.status, at: new Date().toISOString() }]
  }
  if (patch.priority === 'normal' || patch.priority === 'urgent') order.priority = patch.priority
  const row = orderToRow(order)
  row.status = order.status
  const { data, error } = await supabase.from('orders').update(row).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return toOrder(data)
}

export async function decrementMenuStock(lines: { itemId: string; qty: number }[]): Promise<void> {
  if (lines.length === 0) return
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc('decrement_menu_stock', {
    p_items: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
  })
  if (error) throw new Error(error.message)
}

export async function findOrderByNumberAndPhone(number: number, phone: string): Promise<Order | null> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('track_order', { p_number: number, p_phone: phone })
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Row[]
  return rows.length > 0 ? toOrder(rows[0]) : null
}

export async function listComplaintsByPhone(phone: string): Promise<Complaint[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('track_complaints', { p_phone: phone })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Row[]).map(toComplaint)
}

/* --------------------- الطاولات والتقييم ومسار «جاهز» --------------------- */

/**
 * تحديث حالة الطلب إلى «جاهز للتسليم» عبر دالة آمنة.
 * تُستدعى عند مسح الموظف باركود بون المطبخ من متصفح الجوال (دون تسجيل دخول).
 */
export async function markOrderReady(id: string): Promise<Order | null> {
  if (!UUID_RE.test(id)) return null
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('mark_order_ready', { p_id: id })
  if (error) throw new Error(error.message)
  return data ? toOrder(data) : null
}

/** إتمام دفع طلب طاولة: يسجّل الدفع ويغلق الطاولة تلقائيًا ويعيد الطلب المحدّث. */
export async function payTableOrder(id: string, table: string): Promise<Order | null> {
  if (!UUID_RE.test(id)) return null
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('pay_table_order', { p_id: id, p_table: table })
  if (error) throw new Error(error.message)
  return data ? toOrder(data) : null
}

/** تعيين حالة الطاولة: open (مشغولة) / closed (متاحة). */
export async function setTableStatus(tableNo: number, status: 'open' | 'closed'): Promise<void> {
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc('set_table_status', { p_no: tableNo, p_status: status })
  if (error) throw new Error(error.message)
}

/** حفظ تقييم العميل للخدمة بعد إتمام الدفع. */
export async function createRating(input: {
  orderId?: string
  table?: string
  rating: number
  comment?: string
  customer?: string
}): Promise<void> {
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc('create_rating', {
    p_order_id: input.orderId ?? null,
    p_table: input.table ?? null,
    p_rating: input.rating,
    p_comment: input.comment ?? '',
    p_customer: input.customer ?? '',
  })
  if (error) throw new Error(error.message)
}
