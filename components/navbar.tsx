'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const roleConfig = {
    ADMIN: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/registros', label: 'Registros' },
      { href: '/reportes', label: 'Reportes' },
      { href: '/usuarios', label: 'Usuarios' },
      { href: '/configuracion', label: 'Configuración' },
    ],
    SUPERVISOR: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/registros', label: 'Registros' },
      { href: '/reportes', label: 'Reportes' },
    ],
    ENCARGADO: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/registros', label: 'Registros' },
      { href: '/reportes', label: 'Reportes' },
    ],
    OPERARIO: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/registros/nuevo', label: 'Nuevo Registro' },
      { href: '/registros', label: 'Mis Registros' },
    ],
  }

  const links = session?.user?.role 
    ? roleConfig[session.user.role as keyof typeof roleConfig] || []
    : []

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Granja Reproductora
              </span>
            </Link>

            <div className="hidden md:flex space-x-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.role}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  Cerrar Sesión
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}



