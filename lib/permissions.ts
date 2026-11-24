import { roleFromUser } from './roles'

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

/** صلاحيات المستخدم: صاحب المشروع يملك كل الصلاحيات، وغيره تُقرأ من بياناته. */
export function permissionsFromUser(user: UserLike): StaffPermission[] {
  if (roleFromUser(user) === 'owner') return ALL_PERMISSIONS
  return normalizePermissions(user?.user_metadata?.permissions)
}

export function hasPermission(user: UserLike, permission: StaffPermission): boolean {
  return permissionsFromUser(user).includes(permission)
}
