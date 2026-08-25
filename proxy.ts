import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
        cookies: {
            getAll() {
            return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
            )
            },
        },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isLoginPage = pathname === '/admin/login'

    if (pathname.startsWith('/admin') && !isLoginPage && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
    }

    if (isLoginPage && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
  matcher: ['/admin/:path*'],
}