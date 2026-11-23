export type CategoryId =
  | 'restaurant'
  | 'thabaeh'
  | 'walaem'
  | 'eaasha'
  | 'iftar'
  | 'appetizers'
  | 'drinks'

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'restaurant', label: 'أطباق المطعم' },
  { id: 'thabaeh', label: 'الذبائح' },
  { id: 'walaem', label: 'الولائم' },
  { id: 'eaasha', label: 'الإعاشة' },
  { id: 'iftar', label: 'إفطار صائم' },
  { id: 'appetizers', label: 'المقبلات' },
  { id: 'drinks', label: 'المشروبات' },
]

export const BOOKING_CATEGORIES: CategoryId[] = ['thabaeh', 'walaem', 'eaasha']

/** خيارات حجز الذبائح والولائم. */
export const COOKING_STYLES = ['مندي', 'حنيذ', 'مضغوط', 'مظبي', 'مدفون'] as const
export const CUT_STYLES = ['بدون تقطيع', 'مكعبات', 'شرائح', 'قطع كبيرة'] as const

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

export type PaymentMethod = 'mada' | 'applepay' | 'visa' | 'tabby' | 'tamara' | 'pos' | 'bank'
export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'mada', label: 'مدى', hint: 'دفع إلكتروني عبر ميسر' },
  { id: 'applepay', label: 'Apple Pay', hint: 'دفع إلكتروني عبر ميسر' },
  { id: 'visa', label: 'فيزا / ماستركارد', hint: 'دفع إلكتروني عبر ميسر' },
  { id: 'tabby', label: 'تابي', hint: 'قسّمها على 4 دفعات بدون فوائد' },
  { id: 'tamara', label: 'تمارا', hint: 'قسّمها على 3 دفعات بدون فوائد' },
  { id: 'pos', label: 'الشبكة عند الاستلام', hint: 'ادفع بالبطاقة عند الاستلام' },
  { id: 'bank', label: 'تحويل بنكي', hint: 'حوّل وارفق صورة الإيصال' },
]

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'جديد',
  preparing: 'قيد التجهيز',
  ready: 'جاهز للتسليم',
  completed: 'تم التسليم',
  cancelled: 'ملغي',
}

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
  /** كود الاستلام الأمني (5 أرقام) — يظهر للعميل فقط، ولا يُعاد في واجهات الموظفين. */
  pickupCode?: string
  /** هل يحتاج الطلب كود استلام للتحقق قبل التسليم؟ (بديل آمن عن إظهار الكود للموظفين) */
  requiresPickupCode?: boolean
}

export interface Complaint {
  id: string
  createdAt: string
  orderNumber?: string
  name: string
  phone: string
  message: string
  reply: string
  status: 'open' | 'resolved'
}

export interface Purchase {
  id: string
  createdAt: string
  supplier: string
  invoiceNo: string
  date: string
  amount: number
  image?: string
  notes?: string
}

export type LetterType = 'letter' | 'quote' | 'claim'
export const LETTER_TYPES: { id: LetterType; label: string }[] = [
  { id: 'letter', label: 'خطاب رسمي' },
  { id: 'quote', label: 'عرض سعر' },
  { id: 'claim', label: 'مطالبة مالية' },
]

export interface Letter {
  id: string
  createdAt: string
  type: LetterType
  title: string
  recipient: string
  date: string
  body: string
  isTemplate: boolean
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

export type CollectionName = 'menu' | 'zones' | 'complaints' | 'purchases' | 'letters' | 'accounts'

export const COLLECTIONS: CollectionName[] = ['menu', 'zones', 'complaints', 'purchases', 'letters', 'accounts']

export const isCollection = (name: string): name is CollectionName => (COLLECTIONS as string[]).includes(name)
