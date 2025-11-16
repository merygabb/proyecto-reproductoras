import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Permitir acceso a páginas públicas
    if (path === '/login' || path === '/') {
      return NextResponse.next()
    }

    // Verificar si el usuario está autenticado
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Restricciones por rol
    if (path.startsWith('/usuarios') || path.startsWith('/configuracion')) {
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    if (path.startsWith('/reportes')) {
      if (token.role === 'OPERARIO') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/registros/:path*',
    '/reportes/:path*',
    '/usuarios/:path*',
    '/configuracion/:path*',
  ]
}



