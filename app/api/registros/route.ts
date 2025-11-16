import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = session.user.role === 'OPERARIO' 
      ? { usuarioId: session.user.id }
      : {}

    const [registros, total] = await Promise.all([
      prisma.registroProduccion.findMany({
        where,
        include: {
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.registroProduccion.count({ where }),
    ])

    return NextResponse.json({
      registros,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching registros:', error)
    return NextResponse.json({ error: 'Error al cargar registros' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Calcular totales
    const totalHuevos = 
      body.huevoFertilA +
      body.huevoFertilB +
      body.huevoGrande +
      body.huevoMediano +
      body.huevoPequeno +
      body.huevoJumbo +
      body.huevoPicado +
      body.huevoDesecho

    const totalFertiles = body.huevoFertilA + body.huevoFertilB

    const registro = await prisma.registroProduccion.create({
      data: {
        ...body,
        totalHuevos,
        totalFertiles,
        usuarioId: session.user.id,
      },
    })

    // Crear alertas si es necesario
    await crearAlertas(registro)

    return NextResponse.json(registro, { status: 201 })
  } catch (error) {
    console.error('Error creating registro:', error)
    return NextResponse.json({ error: 'Error al crear registro' }, { status: 500 })
  }
}

async function crearAlertas(registro: any) {
  const alertas = []

  // Alerta de mortalidad alta
  if (registro.mortalidadHembra > 5) {
    alertas.push({
      tipo: 'MORTALIDAD_ALTA',
      severidad: 'CRITICAL',
      titulo: 'Mortalidad Alta Detectada',
      descripcion: `Se registraron ${registro.mortalidadHembra} muertes de hembras hoy. Revisar condiciones.`,
    })
  }

  // Alerta de producción baja
  if (registro.totalHuevos < 100) {
    alertas.push({
      tipo: 'PRODUCCION_BAJA',
      severidad: 'WARNING',
      titulo: 'Producción Baja',
      descripcion: `Solo se produjeron ${registro.totalHuevos} huevos hoy.`,
    })
  }

  // Alerta de fertilidad baja
  const porcentajeFertilidad = registro.totalHuevos > 0 
    ? (registro.totalFertiles / registro.totalHuevos) * 100 
    : 0

  if (porcentajeFertilidad < 85 && registro.totalHuevos > 0) {
    alertas.push({
      tipo: 'FERTILIDAD_BAJA',
      severidad: 'WARNING',
      titulo: 'Fertilidad Baja',
      descripcion: `La fertilidad es del ${porcentajeFertilidad.toFixed(1)}%, por debajo del 85% esperado.`,
    })
  }

  if (alertas.length > 0) {
    await prisma.alerta.createMany({
      data: alertas,
    })
  }
}



