import { roleFromUser, type StaffRole } from './roles'

/** صلاحيات الموظفين القابلة للتفعيل/التعطيل لكل حساب. */
export type StaffPermission =
  | 'menu_manage'
  | 'discount'
  | 'refund'
  | 'print_invoice'
  | 'quote'
  | 'company_invoice'
  | 'finance_reports'
  | 'adhahi_manage'

/** قائمة الصلاحيات المعروضة في مصفوفة الصلاحيات. */
export const STAFF_PERMISSIONS: { id: StaffPermission; label: string }[] = [
  { id: 'menu_manage', label: 'إضافة/تعديل المنيو' },
  { id: 'discount', label: 'عمل خصم' },
  { id: 'refund', label: 'إرجاع مبلغ للعميل' },
  { id: 'print_invoice', label: 'طباعة فاتورة' },
  { id: 'quote', label: 'إنشاء/طباعة عرض سعر' },
  { id: 'company_invoice', label: 'طباعة فاتورة شركات' },
  { id: 'finance_reports', label: 'طباعة قوائم مالية' },
  { id: 'adhahi_manage', label: 'إدارة الأضاحي' },
]

export const ALL_PERMISSIONS: StaffPermission[] = STAFF_PERMISSIONS.map((p) => p.id)

/**
 * الصلاحيات الافتراضية لكل دور وظيفي، تُطبّق تلقائيًا عند إنشاء الحساب
 * داخل واجهة الإدارة حسب القسم (المطعم / المطبخ)، ويمكن تخصيصها لاحقًا
 * بتعديل قائمة صلاحيات الحساب.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  owner: ALL_PERMISSIONS,
  restaurant_manager: ['menu_manage', 'discount', 'refund', 'print_invoice', 'quote', 'company_invoice', 'finance_reports'],
  restaurant_supervisor: ['menu_manage', 'discount', 'print_invoice', 'quote', 'company_invoice'],
  kitchen_manager: ['adhahi_manage', 'menu_manage', 'print_invoice', 'quote', 'finance_reports'],
  kitchen_supervisor: ['adhahi_manage', 'menu_manage', 'print_invoice'],
  kitchen: ['print_invoice'],
  staff: ['print_invoice'],
}

export function isStaffPermission(value: unknown): value is StaffPermission {
  return typeof value === 'string' && (ALL_PERMISSIONS as string[]).includes(value)
}

/** ينقّي القائمة الواردة ويحصرها في الصلاحيات المعروفة. */
export function normalizePermissions(value: unknown): StaffPermission[] {
  const raw = Array.isArray(value) ? value : []
  return ALL_PERMISSIONS.filter((p) => raw.includes(p))
}

type UserLike =
  | { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }
  | null
  | undefined

/**
 * صلاحيات المستخدم: صاحب المشروع يملك كل الصلاحيات.
 * لغيره: إن كانت هناك صلاحيات مخصّصة محفوظة في حساب الموظف تُستخدم كما هي،
 * وإلا تُشتق من الدور الوظيفي الافتراضي (مدير/مشرف مطعم أو مطبخ...إلخ).
 */
export function permissionsFromUser(user: UserLike): StaffPermission[] {
  const role = roleFromUser(user)
  if (role === 'owner') return ALL_PERMISSIONS
  const stored = user?.user_metadata?.permissions
  if (Array.isArray(stored)) return normalizePermissions(stored)
  return ROLE_DEFAULT_PERMISSIONS[role]
}

export function hasPermission(user: UserLike, permission: StaffPermission): boolean {
  return permissionsFromUser(user).includes(permission)
}
