import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Función para generar email automático basado en el nombre
function generarEmail(nombre: string): string {
  // Normalizar el nombre: convertir a minúsculas, quitar acentos, espacios a puntos
  const normalizado = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s+/g, '.') // Espacios a puntos
    .replace(/[^a-z0-9.]/g, '') // Solo letras, números y puntos
  
  // Tomar primer nombre y apellido si existen
  const partes = normalizado.split('.')
  const emailBase = partes.length > 1 
    ? `${partes[0]}.${partes[partes.length - 1]}`
    : partes[0]
  
  return `${emailBase}@granja.com`
}

// Función para generar contraseña temporal
function generarPasswordTemporal(): string {
  return `temp${Math.random().toString(36).slice(-8)}`
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuarios = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
        _count: {
          select: {
            registros: true,
          },
        },
      },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error fetching usuarios:', error)
    return NextResponse.json({ error: 'Error al cargar usuarios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, email, role, password } = body

    // Validaciones
    if (!nombre || !role) {
      return NextResponse.json({ error: 'Nombre y rol son requeridos' }, { status: 400 })
    }

    // Generar email automático si no se proporciona
    let emailFinal = email
    if (!emailFinal) {
      emailFinal = generarEmail(nombre)
      
      // Verificar si el email ya existe y agregar número si es necesario
      let emailBase = emailFinal
      let counter = 1
      while (await prisma.user.findUnique({ where: { email: emailFinal } })) {
        emailFinal = `${emailBase.split('@')[0]}${counter}@${emailBase.split('@')[1]}`
        counter++
      }
    } else {
      // Verificar si el email ya existe
      const existe = await prisma.user.findUnique({ where: { email: emailFinal } })
      if (existe) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
      }
    }

    // Generar contraseña si no se proporciona
    const passwordFinal = password || generarPasswordTemporal()
    const hashedPassword = await bcrypt.hash(passwordFinal, 10)

    const usuario = await prisma.user.create({
      data: {
        nombre,
        email: emailFinal,
        password: hashedPassword,
        role: role,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
      },
    })

    // Devolver también la contraseña temporal si se generó automáticamente
    return NextResponse.json({
      usuario,
      passwordTemporal: !password ? passwordFinal : undefined,
      mensaje: !password ? `Usuario creado. Contraseña temporal: ${passwordFinal}` : 'Usuario creado exitosamente',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating usuario:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // No permitir eliminar al propio usuario
    if (id === session.user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
    }

    // Verificar si el usuario tiene registros
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registros: true,
          },
        },
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // En lugar de eliminar, desactivar el usuario si tiene registros
    if (usuario._count.registros > 0) {
      await prisma.user.update({
        where: { id },
        data: { activo: false },
      })
      return NextResponse.json({ mensaje: 'Usuario desactivado (tiene registros asociados)' })
    }

    // Eliminar si no tiene registros
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ mensaje: 'Usuario eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting usuario:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nombre, email, role, activo, password } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (nombre) updateData.nombre = nombre
    if (email) {
      // Verificar que el email no esté en uso por otro usuario
      const existe = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      })
      if (existe) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
      }
      updateData.email = email
    }
    if (role) updateData.role = role
    if (typeof activo === 'boolean') updateData.activo = activo
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error updating usuario:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

