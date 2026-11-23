import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccess, protectedRouteFor, roleFromUser, ROLE_HOME } from '@/lib/roles'

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      },
    },
  })

  // تحديث جلسة Supabase (وتجديد التوكن عند الحاجة).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const route = protectedRouteFor(pathname)

  // مسار محمي بدون تسجيل دخول: أعد التوجيه إلى صفحة الدخول.
  if (route && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    redirectUrl.searchParams.set('next', pathname)
    return redirectWithCookies(redirectUrl, response)
  }

  // مسجّل الدخول: وجّهه إلى قسمه المسموح حسب دوره.
  if (route && user) {
    const role = roleFromUser(user)
    if (!canAccess(role, pathname)) {
      const target = ROLE_HOME[role]
      if (target !== pathname) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = target
        redirectUrl.search = ''
        return redirectWithCookies(redirectUrl, response)
      }
    }
  }

  if (pathname === '/login') {
    if (!user) return response
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = ROLE_HOME[roleFromUser(user)]
    redirectUrl.search = ''
    return redirectWithCookies(redirectUrl, response)
  }

  return response
}

/** يحوّل مع الحفاظ على كوكيز الجلسة المُحدّثة. */
function redirectWithCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url)
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff|woff2)$).*)',
  ],
}
