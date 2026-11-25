export type StaffRole =
  | 'owner'
  | 'restaurant_manager'
  | 'restaurant_supervisor'
  | 'kitchen_manager'
  | 'kitchen_supervisor'
  | 'kitchen'
  | 'staff'

/** الأدوار التي تعمل في قسم المطعم. */
export const RESTAURANT_ROLES: StaffRole[] = ['owner', 'restaurant_manager', 'restaurant_supervisor', 'staff']
/** الأدوار التي تعمل في قسم المطبخ. */
export const KITCHEN_ROLES: StaffRole[] = ['owner', 'kitchen_manager', 'kitchen_supervisor', 'kitchen']

/** نطاق البريد الداخلي المشتق من اسم المستخدم (رقم الجوال أو الهوية) لحسابات الموظفين. */
export const STAFF_EMAIL_DOMAIN = 'staff.wadidoan.sa'

/**
 * يوحّد اسم المستخدم الرقمي إلى صيغة قياسية لضمان تطابق تسجيل الدخول:
 * يحذف الرموز ومقدمة الدولة (966 / 0) ليصبح رقم الجوال 9 خانات، ويُبقي رقم الهوية 10 خانات.
 */
export function normalizeUsername(value: string): string {
  const v = value.trim()
  if (v.includes('@')) return v.toLowerCase()
  let d = v.replace(/\D/g, '')
  if (d.startsWith('966') && d.length === 12) d = d.slice(3)
  else if (d.startsWith('0') && d.length === 10) d = d.slice(1)
  return d || v.toLowerCase()
}

/** يحوّل اسم المستخدم (رقم الجوال أو الهوية) إلى بريد داخلي لحساب Supabase Auth. */
export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${STAFF_EMAIL_DOMAIN}`
}

/** يقبل البريد الإلكتروني كما هو، أو يحوّل اسم المستخدم (بدون @) إلى البريد الداخلي. */
export function loginIdToEmail(value: string): string {
  const v = value.trim()
  return v.includes('@') ? v.toLowerCase() : usernameToEmail(v)
}

/** الصفحة الرئيسية لكل دور بعد تسجيل الدخول. */
export const ROLE_HOME: Record<StaffRole, string> = {
  owner: '/admin',
  restaurant_manager: '/staff',
  restaurant_supervisor: '/staff',
  kitchen_manager: '/kitchen',
  kitchen_supervisor: '/kitchen',
  kitchen: '/kitchen',
  staff: '/staff',
}

/** المسارات المحمية والأدوار المسموح لها بالدخول إليها. */
export const PROTECTED_ROUTES: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: '/account', roles: ['owner', 'restaurant_manager', 'restaurant_supervisor', 'kitchen_manager', 'kitchen_supervisor', 'kitchen', 'staff'] },
  { prefix: '/staff', roles: ['staff', 'restaurant_manager', 'restaurant_supervisor', 'owner'] },
  { prefix: '/kitchen', roles: ['kitchen', 'kitchen_manager', 'kitchen_supervisor', 'owner'] },
  { prefix: '/admin', roles: ['owner'] },
]

type UserLike =
  | { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }
  | null
  | undefined

const STAFF_ROLES: StaffRole[] = [
  'owner',
  'restaurant_manager',
  'restaurant_supervisor',
  'kitchen_manager',
  'kitchen_supervisor',
  'kitchen',
  'staff',
]

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as string[]).includes(value)
}

/** يستخرج الدور من بيانات مستخدم Supabase Auth، والافتراضي «صاحب المشروع» للحسابات القديمة. */
export function roleFromUser(user: UserLike): StaffRole {
  const value = user?.user_metadata?.role ?? user?.app_metadata?.role
  return isStaffRole(value) ? value : 'owner'
}

export function protectedRouteFor(pathname: string) {
  return PROTECTED_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
}

export function canAccess(role: StaffRole, pathname: string): boolean {
  const route = protectedRouteFor(pathname)
  return !route || route.roles.includes(role)
}

const ROUTE_LABEL: Record<string, string> = {
  '/account': 'حسابي',
  '/staff': 'موظفو المطعم',
  '/kitchen': 'المطبخ',
  '/admin': 'صاحب المشروع',
}

/** روابط شريط التنقل التي تظهر للدور في الترويسة. */
export function staffNavLinks(role: StaffRole): { href: string; label: string }[] {
  return PROTECTED_ROUTES.filter((r) => r.roles.includes(role)).map((r) => ({
    href: r.prefix,
    label: ROUTE_LABEL[r.prefix],
  }))
}
