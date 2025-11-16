'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatearFecha } from '@/lib/utils'

interface Usuario {
  id: string
  email: string
  nombre: string
  role: string
  activo: boolean
  createdAt: string
  _count: {
    registros: number
  }
}

export default function UsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    role: 'OPERARIO',
    password: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      fetchUsuarios()
    }
  }, [status, session])

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios')
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensajeExito(null)
    setPasswordTemporal(null)

    try {
      const url = editandoUsuario ? '/api/usuarios' : '/api/usuarios'
      const method = editandoUsuario ? 'PATCH' : 'POST'
      const body = editandoUsuario
        ? { id: editandoUsuario.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        setMensajeExito(data.mensaje || 'Usuario guardado exitosamente')
        if (data.passwordTemporal) {
          setPasswordTemporal(data.passwordTemporal)
        }
        setMostrarFormulario(false)
        setEditandoUsuario(null)
        setFormData({ nombre: '', email: '', role: 'OPERARIO', password: '' })
        fetchUsuarios()
        
        // Limpiar mensajes después de 5 segundos
        setTimeout(() => {
          setMensajeExito(null)
          setPasswordTemporal(null)
        }, 5000)
      } else {
        alert(data.error || 'Error al guardar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar usuario')
    }
  }

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/usuarios?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.mensaje || 'Usuario eliminado exitosamente')
        fetchUsuarios()
      } else {
        alert(data.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    }
  }

  const handleEditar = (usuario: Usuario) => {
    setEditandoUsuario(usuario)
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.role,
      password: '',
    })
    setMostrarFormulario(true)
    setMostrarPassword(false)
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setEditandoUsuario(null)
    setFormData({ nombre: '', email: '', role: 'OPERARIO', password: '' })
    setMostrarPassword(false)
  }

  const handleToggleActivo = async (usuario: Usuario) => {
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: usuario.id,
          activo: !usuario.activo,
        }),
      })

      if (res.ok) {
        fetchUsuarios()
      } else {
        alert('Error al actualizar estado del usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar estado del usuario')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    ENCARGADO: 'Encargado',
    OPERARIO: 'Operario',
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    SUPERVISOR: 'bg-blue-100 text-blue-800',
    ENCARGADO: 'bg-green-100 text-green-800',
    OPERARIO: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra los usuarios del sistema</p>
          </div>
          <Button onClick={() => setMostrarFormulario(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Usuario
          </Button>
        </div>

        {/* Mensajes de éxito */}
        {(mensajeExito || passwordTemporal) && (
          <Card className={`mb-6 ${passwordTemporal ? 'border-2 border-green-500' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900 mb-1">{mensajeExito || 'Operación exitosa'}</p>
                  {passwordTemporal && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-200">
                      <p className="text-sm font-semibold text-gray-700 mb-1">⚠️ Contraseña Temporal:</p>
                      <p className="text-lg font-mono font-bold text-green-700 bg-gray-50 p-2 rounded">
                        {passwordTemporal}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Guarda esta contraseña. El usuario debe cambiarla en el primer inicio de sesión.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario de crear/editar */}
        {mostrarFormulario && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editandoUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</CardTitle>
              <CardDescription>
                {editandoUsuario 
                  ? 'Modifica la información del usuario' 
                  : 'El correo se generará automáticamente si no se especifica'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan.perez@granja.com (opcional, se genera automático)"
                      disabled={!!editandoUsuario}
                    />
                    {!editandoUsuario && (
                      <p className="text-xs text-gray-500">
                        Si no especificas, se generará automáticamente basado en el nombre
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      required
                    >
                      <option value="OPERARIO">Operario</option>
                      <option value="ENCARGADO">Encargado</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Contraseña {editandoUsuario && '(dejar vacío para no cambiar)'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        name="password"
                        type={mostrarPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editandoUsuario ? 'Nueva contraseña' : 'Se generará automáticamente'}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                      >
                        {mostrarPassword ? '👁️' : '👁️‍🗨️'}
                      </Button>
                    </div>
                    {!editandoUsuario && (
                      <p className="text-xs text-gray-500">
                        Se generará una contraseña temporal aleatoria
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit">
                    {editandoUsuario ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelar}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de usuarios */}
        <div className="grid grid-cols-1 gap-4">
          {usuarios.map((usuario) => (
            <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{usuario.nombre}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[usuario.role]}`}>
                        {roleLabels[usuario.role]}
                      </span>
                      {!usuario.activo && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Email:</strong> {usuario.email}</p>
                      <p><strong>Registros:</strong> {usuario._count.registros} registros creados</p>
                      <p><strong>Creado:</strong> {formatearFecha(usuario.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {usuario.id !== session?.user.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActivo(usuario)}
                        >
                          {usuario.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditar(usuario)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEliminar(usuario.id, usuario.nombre)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                    {usuario.id === session?.user.id && (
                      <span className="text-xs text-gray-500 self-center">Usuario actual</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usuarios.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">No hay usuarios registrados</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

