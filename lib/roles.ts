export type StaffRole = 'owner' | 'kitchen' | 'staff'

/** الصفحة الرئيسية لكل دور بعد تسجيل الدخول. */
export const ROLE_HOME: Record<StaffRole, string> = {
  owner: '/admin',
  kitchen: '/kitchen',
  staff: '/staff',
}

/** المسارات المحمية والأدوار المسموح لها بالدخول إليها. */
export const PROTECTED_ROUTES: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: '/staff', roles: ['staff', 'owner'] },
  { prefix: '/kitchen', roles: ['kitchen', 'owner'] },
  { prefix: '/admin', roles: ['owner'] },
]

type UserLike =
  | { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }
  | null
  | undefined

export function isStaffRole(value: unknown): value is StaffRole {
  return value === 'owner' || value === 'kitchen' || value === 'staff'
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
