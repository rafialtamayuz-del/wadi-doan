import type { StaffPermission } from './permissions'

export type CategoryId =
  | 'restaurant'
  | 'thabaeh'
  | 'adhahi'
  | 'dhabh'
  | 'walaem'
  | 'wedding'
  | 'eaasha'
  | 'iftar'
  | 'appetizers'
  | 'drinks'

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'restaurant', label: 'منيو المطعم' },
  { id: 'thabaeh', label: 'الذبائح' },
  { id: 'adhahi', label: 'الأضاحي' },
  { id: 'dhabh', label: 'الذبح' },
  { id: 'walaem', label: 'الولائم' },
  { id: 'wedding', label: 'زواج' },
  { id: 'eaasha', label: 'الإعاشة' },
  { id: 'iftar', label: 'إفطار صائم' },
  { id: 'appetizers', label: 'المقبلات' },
  { id: 'drinks', label: 'المشروبات' },
]

export const BOOKING_CATEGORIES: CategoryId[] = ['thabaeh', 'adhahi', 'dhabh', 'walaem', 'wedding', 'eaasha']

/** خيارات التصنيف الرئيسية لحجز الذبائح والولائم (ذبيحة / وليمة / زواج / أضحية). */
export const BOOKING_TYPE_CHOICES: { id: CategoryId; label: string }[] = [
  { id: 'thabaeh', label: 'ذبيحة' },
  { id: 'walaem', label: 'وليمة' },
  { id: 'wedding', label: 'زواج' },
  { id: 'adhahi', label: 'أضحية' },
]

/** التصنيفات التي تحتاج تحديد طريقة التفصيل (الذبائح والأضاحي والذبح). */
export const SLAUGHTER_CATEGORIES: CategoryId[] = ['thabaeh', 'adhahi', 'dhabh']

/** خيارات حجز الذبائح والولائم. */
export const COOKING_STYLES = ['مندي', 'حنيذ', 'مضغوط', 'مظبي', 'مدفون'] as const
export const CUT_STYLES = ['بدون تقطيع', 'مكعبات', 'شرائح', 'قطع كبيرة'] as const
/** طرق تفصيل الأضاحي والذبائح. */
export const CUTTING_STYLES = ['حضرمي', 'ثلاجة', 'أرباع', 'كامل', 'تفصيل مخصص'] as const

export const ALLERGENS = ['جلوتين', 'ألبان', 'مكسرات', 'بيض', 'سمسم', 'سمك', 'صويا']

/** مكان ظهور الصنف: منيو المطعم فقط / منيو المطبخ والولائم فقط / كلاهما. */
export type MenuSection = 'restaurant' | 'kitchen' | 'both'
export const MENU_SECTIONS: { id: MenuSection; label: string; short: string }[] = [
  { id: 'restaurant', label: 'منيو المطعم فقط', short: 'المطعم' },
  { id: 'kitchen', label: 'منيو المطبخ والولائم فقط', short: 'المطبخ' },
  { id: 'both', label: 'كلاهما (المطعم والمطبخ)', short: 'الكل' },
]
/** أقسام الأصناف التي تظهر في قسم حجز الذبائح والولائم (المطبخ). */
export const KITCHEN_SECTIONS: MenuSection[] = ['kitchen', 'both']
/** أقسام الأصناف التي تظهر في منيو المطعم للطلب الفوري. */
export const RESTAURANT_SECTIONS: MenuSection[] = ['restaurant', 'both']

export interface MenuItem {
  id: string
  name: string
  category: CategoryId
  description: string
  ingredients: string
  price: number
  discount: number
  image: string
  allergens: string[]
  stock: number | null
  active: boolean
  menuSection: MenuSection
  createdAt: string
}

export interface Zone {
  id: string
  name: string
  fee: number
  active: boolean
  createdAt: string
}

export type OrderType = 'dinein' | 'takeaway' | 'delivery' | 'pickup'
export const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: 'dinein', label: 'محلي' },
  { id: 'takeaway', label: 'سفري' },
  { id: 'delivery', label: 'توصيل' },
  { id: 'pickup', label: 'استلام من الفرع/المطبخ' },
]

export type PaymentMethod = 'mada' | 'applepay' | 'visa' | 'tabby' | 'tamara' | 'pos' | 'cash' | 'bank'
export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'mada', label: 'مدى', hint: 'دفع إلكتروني عبر ميسر' },
  { id: 'applepay', label: 'Apple Pay', hint: 'دفع إلكتروني عبر ميسر' },
  { id: 'visa', label: 'فيزا / ماستركارد', hint: 'دفع إلكتروني عبر ميسر' },
  { id: 'tabby', label: 'تابي', hint: 'قسّمها على 4 دفعات بدون فوائد' },
  { id: 'tamara', label: 'تمارا', hint: 'قسّمها على 3 دفعات بدون فوائد' },
  { id: 'pos', label: 'الشبكة عند الاستلام', hint: 'ادفع بالبطاقة عند الاستلام أو المحاسبة' },
  { id: 'cash', label: 'الدفع كاش', hint: 'نقدًا عند الاستلام أو المحاسبة' },
  { id: 'bank', label: 'تحويل بنكي', hint: 'حوّل وارفق صورة الإيصال' },
]

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'settled' | 'cancelled'
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'جديد',
  preparing: 'قيد التجهيز',
  ready: 'جاهز للتسليم',
  completed: 'تم التسليم',
  settled: 'تم السداد',
  cancelled: 'ملغي',
}

/** الطلبات النشطة التي ما زالت قيد التنفيذ. */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['new', 'preparing', 'ready']
/** الطلبات المنتهية / المسلمة التي تم أرشفتها. */
export const ARCHIVED_ORDER_STATUSES: OrderStatus[] = ['completed', 'settled', 'cancelled']

export interface OrderLine {
  itemId: string
  name: string
  unitPrice: number
  qty: number
  category: CategoryId
  /** تفاصيل الحجز مثل: طريقة الطبخ · نوع التقطيع. */
  options?: string
}

export interface Order {
  id: string
  number: number
  createdAt: string
  type: OrderType
  table?: string
  zoneId?: string
  zoneName?: string
  address?: string
  /** العنوان الوطني المختصر (4 حروف و4 أرقام) مثل RRRD2929. */
  shortAddress?: string
  /** إحداثيات موقع التوصيل المستخرجة من خرائط جوجل. */
  lat?: number
  lng?: number
  pickupFrom?: 'branch' | 'kitchen'
  customerName: string
  phone: string
  scheduledAt?: string
  guests?: number
  notes?: string
  lines: OrderLine[]
  subtotal: number
  deliveryFee: number
  total: number
  vat: number
  isBooking: boolean
  priority: 'normal' | 'urgent'
  payment: {
    method: PaymentMethod
    status: 'paid' | 'pending' | 'review'
    receipt?: string
    installments?: number
  }
  status: OrderStatus
  history: { status: OrderStatus; at: string }[]
  /** كود الاستلام (4 أرقام) للطلبات الإلكترونية، يظهر للعميل ولموظفي المطعم والمطبخ. */
  pickupCode?: string
}

/** نوع رسالة الشكاوى والمقترحات. */
export type ComplaintType = 'complaint' | 'suggestion'
export const COMPLAINT_TYPES: { id: ComplaintType; label: string }[] = [
  { id: 'complaint', label: 'شكوى' },
  { id: 'suggestion', label: 'اقتراح' },
]

export interface Complaint {
  id: string
  createdAt: string
  type: ComplaintType
  orderNumber?: string
  name: string
  phone: string
  message: string
  reply: string
  status: 'open' | 'resolved'
}

/** سطر تفريغ أصناف فاتورة المشتريات. */
export interface PurchaseLine {
  name: string
  qty: number
  price: number
  group: string
}

export interface Purchase {
  id: string
  createdAt: string
  supplier: string
  invoiceNo: string
  date: string
  amount: number
  lines: PurchaseLine[]
  image?: string
  notes?: string
}

export type LetterType = 'letter' | 'quote' | 'claim'
export const LETTER_TYPES: { id: LetterType; label: string }[] = [
  { id: 'letter', label: 'خطاب رسمي' },
  { id: 'quote', label: 'عرض سعر' },
  { id: 'claim', label: 'مطالبة مالية' },
]

/** صيغ اللقب الختامي في سطر الجهة المرسل إليها. */
export const RECIPIENT_TITLES = ['الموقر', 'المحترم', 'حفظه الله'] as const

/** مسميات أصحاب الصلاحية والاعتماد على الخطابات. */
export const SIGNER_ROLES = ['المدير العام', 'نائب المدير'] as const

export interface Letter {
  id: string
  createdAt: string
  type: LetterType
  number: string
  title: string
  recipient: string
  recipientTitle: string
  date: string
  attachments: string
  body: string
  signerRole: string
  signerName: string
  signature: string
  isTemplate: boolean
  /** وسيلة الإرسال الأخيرة: email / whatsapp / print (تُملأ تلقائيًا عند الإرسال أو الطباعة). */
  sentVia?: string
  /** وقت آخر إرسال أو طباعة. */
  sentAt?: string
}

export interface BankAccount {
  id: string
  createdAt: string
  bank: string
  holder: string
  iban: string
  accountNo: string
  owner: 'restaurant' | 'kitchen'
  active: boolean
}

export interface BusinessLocation {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

/* ------------------------- الموظفون والصلاحيات ------------------------- */

export type StaffAccountRole =
  | 'owner'
  | 'restaurant_manager'
  | 'restaurant_supervisor'
  | 'kitchen_manager'
  | 'kitchen_supervisor'
  | 'kitchen'
  | 'staff'

export const STAFF_ACCOUNT_ROLES: { id: StaffAccountRole; label: string; home: 'admin' | 'staff' | 'kitchen' }[] = [
  { id: 'owner', label: 'صاحب المشروع', home: 'admin' },
  { id: 'restaurant_manager', label: 'مدير مطعم', home: 'staff' },
  { id: 'restaurant_supervisor', label: 'مشرف مطعم', home: 'staff' },
  { id: 'kitchen_manager', label: 'مدير مطبخ', home: 'kitchen' },
  { id: 'kitchen_supervisor', label: 'مشرف مطبخ', home: 'kitchen' },
  { id: 'staff', label: 'موظف المطعم', home: 'staff' },
  { id: 'kitchen', label: 'موظف المطبخ', home: 'kitchen' },
]

export interface StaffAccount {
  id: string
  email: string
  fullName: string
  username: string
  phone: string
  role: StaffAccountRole
  permissions: StaffPermission[]
  createdAt: string
  lastSignInAt?: string
}

/* --------------------------- القوائم المالية --------------------------- */

export type ReportPeriod = 'monthly' | 'annual'

export const REPORT_PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: 'monthly', label: 'قائمة شهرية' },
  { id: 'annual', label: 'قائمة سنوية' },
]

export const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export interface FinancialReport {
  id: string
  createdAt: string
  period: ReportPeriod
  year: number
  month?: number
  label: string
  revenue: number
  purchases: number
  expenses: number
  netProfit: number
  ordersCount: number
  notes?: string
}

/* ---------------------- فاتورة الشركات والقطاعات ---------------------- */

export interface InvoiceLine {
  description: string
  qty: number
  unitPrice: number
}

export interface CompanyInvoice {
  id: string
  createdAt: string
  number: string
  date: string
  buyerName: string
  buyerAddress: string
  buyerCr: string
  /** الرقم الضريبي للمشتري (اختياري غير ملزم). */
  buyerVat?: string
  lines: InvoiceLine[]
  notes?: string
}

export interface Settings {
  name: string
  tagline: string
  about: string
  logo: string
  primaryColor: string
  accentColor: string
  phone: string
  phone2: string
  whatsapp: string
  email: string
  city: string
  district: string
  vatNumber: string
  crNumber: string
  hours: { label: string; time: string }[]
  locations: BusinessLocation[]
  gateways: Record<PaymentMethod, boolean>
  zones: Zone[]
  accounts: BankAccount[]
}

export type CollectionName =
  | 'menu'
  | 'zones'
  | 'complaints'
  | 'purchases'
  | 'letters'
  | 'accounts'
  | 'reports'
  | 'invoices'

export const COLLECTIONS: CollectionName[] = [
  'menu',
  'zones',
  'complaints',
  'purchases',
  'letters',
  'accounts',
  'reports',
  'invoices',
]

export const isCollection = (name: string): name is CollectionName => (COLLECTIONS as string[]).includes(name)
