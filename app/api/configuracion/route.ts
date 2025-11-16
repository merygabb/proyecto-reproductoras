import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener o crear configuración
    let config = await prisma.configuracionGranja.findFirst()

    if (!config) {
      // Crear configuración por defecto
      config = await prisma.configuracionGranja.create({
        data: {
          nombreGranja: 'Granja Reproductora',
          totalHembras: 1000,
          totalMachos: 100,
          porcentajeMortalidadMaximo: 0.5,
          consumoAlimentoHembraMin: 120,
          consumoAlimentoHembraMax: 150,
          consumoAlimentoMachoMin: 130,
          consumoAlimentoMachoMax: 160,
          porcentajeProduccionMinimo: 85,
          porcentajeFertilidadMinimo: 90,
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching configuracion:', error)
    return NextResponse.json({ error: 'Error al cargar configuración' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Obtener o crear configuración
    let config = await prisma.configuracionGranja.findFirst()

    if (!config) {
      config = await prisma.configuracionGranja.create({
        data: body,
      })
    } else {
      config = await prisma.configuracionGranja.update({
        where: { id: config.id },
        data: body,
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating configuracion:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}

