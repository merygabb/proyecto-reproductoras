import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns'

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
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | null
    const exportAll = searchParams.get('export') === '1'

    // Filtro por periodo
    let dateFilter: any = {}
    if (period) {
      const now = new Date()
      if (period === 'day') {
        dateFilter = { gte: startOfDay(now), lte: endOfDay(now) }
      } else if (period === 'week') {
        dateFilter = { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) }
      } else if (period === 'month') {
        dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) }
      }
    }

    const whereBase = session.user.role === 'OPERARIO' 
      ? { usuarioId: session.user.id }
      : {}

    const where = period ? { ...whereBase, fecha: dateFilter } : whereBase

    // Si es exportación, devolver todo sin paginar
    if (exportAll) {
      const registros = await prisma.registroProduccion.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, email: true } },
        },
        orderBy: { fecha: 'desc' },
      })
      return NextResponse.json({ registros, pagination: null })
    }

    const [registros, total] = await Promise.all([
      prisma.registroProduccion.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, email: true } },
        },
        orderBy: { fecha: 'desc' },
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

  // Movimientos automáticos de inventario
  await crearMovimientosInventario(registro)

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

async function crearMovimientosInventario(registro: any) {
  try {
    const movimientosAlimento: any[] = []
    const movimientosAves: any[] = []
    const movimientosHuevo: any[] = []

    // Consumo de alimento (CONSUMO)
    if (registro.alimentoHembra && registro.alimentoHembra > 0) {
      movimientosAlimento.push({
        fecha: registro.fecha,
        tipo: 'CONSUMO',
        sexo: 'HEMBRA',
        cantidadKg: registro.alimentoHembra,
        referenciaRegistroId: registro.id,
      })
    }
    if (registro.alimentoMacho && registro.alimentoMacho > 0) {
      movimientosAlimento.push({
        fecha: registro.fecha,
        tipo: 'CONSUMO',
        sexo: 'MACHO',
        cantidadKg: registro.alimentoMacho,
        referenciaRegistroId: registro.id,
      })
    }

    // Mortalidad (MORTALIDAD)
    if (registro.mortalidadHembra && registro.mortalidadHembra > 0) {
      movimientosAves.push({
        fecha: registro.fecha,
        tipo: 'MORTALIDAD',
        sexo: 'HEMBRA',
        cantidad: registro.mortalidadHembra,
        referenciaRegistroId: registro.id,
      })
    }
    if (registro.mortalidadMacho && registro.mortalidadMacho > 0) {
      movimientosAves.push({
        fecha: registro.fecha,
        tipo: 'MORTALIDAD',
        sexo: 'MACHO',
        cantidad: registro.mortalidadMacho,
        referenciaRegistroId: registro.id,
      })
    }

    // Ingreso de producción de huevos (INGRESO)
    const mapHuevos: { [k: string]: number } = {
      FERTIL_A: registro.huevoFertilA || 0,
      FERTIL_B: registro.huevoFertilB || 0,
      JUMBO: registro.huevoJumbo || 0,
      GRANDE: registro.huevoGrande || 0,
      MEDIANO: registro.huevoMediano || 0,
      PEQUENO: registro.huevoPequeno || 0,
      PICADO: registro.huevoPicado || 0,
      DESECHO: registro.huevoDesecho || 0,
    }
    Object.entries(mapHuevos).forEach(([categoria, cantidad]) => {
      if (cantidad > 0) {
        movimientosHuevo.push({
          fecha: registro.fecha,
          categoria,
          tipo: 'INGRESO',
          cantidad,
          referenciaRegistroId: registro.id,
        })
      }
    })

    // Ingresos opcionales capturados por operario en el formulario
    if (registro.ingresoAlimentoHembra && registro.ingresoAlimentoHembra > 0) {
      movimientosAlimento.push({
        fecha: registro.fecha,
        tipo: 'INGRESO',
        sexo: 'HEMBRA',
        cantidadKg: registro.ingresoAlimentoHembra,
        referenciaRegistroId: registro.id,
      })
    }
    if (registro.ingresoAlimentoMacho && registro.ingresoAlimentoMacho > 0) {
      movimientosAlimento.push({
        fecha: registro.fecha,
        tipo: 'INGRESO',
        sexo: 'MACHO',
        cantidadKg: registro.ingresoAlimentoMacho,
        referenciaRegistroId: registro.id,
      })
    }
    if (registro.ingresoAvesHembra && registro.ingresoAvesHembra > 0) {
      movimientosAves.push({
        fecha: registro.fecha,
        tipo: 'INGRESO',
        sexo: 'HEMBRA',
        cantidad: registro.ingresoAvesHembra,
        referenciaRegistroId: registro.id,
      })
    }
    if (registro.ingresoAvesMacho && registro.ingresoAvesMacho > 0) {
      movimientosAves.push({
        fecha: registro.fecha,
        tipo: 'INGRESO',
        sexo: 'MACHO',
        cantidad: registro.ingresoAvesMacho,
        referenciaRegistroId: registro.id,
      })
    }

    // Salidas de huevo opcionales capturadas por operario
    const mapSalidas: { [k: string]: number } = {
      FERTIL_A: registro.salidaFertilA || 0,
      FERTIL_B: registro.salidaFertilB || 0,
      JUMBO: registro.salidaJumbo || 0,
      GRANDE: registro.salidaGrande || 0,
      MEDIANO: registro.salidaMediano || 0,
      PEQUENO: registro.salidaPequeno || 0,
      PICADO: registro.salidaPicado || 0,
      DESECHO: registro.salidaDesecho || 0,
    }
    Object.entries(mapSalidas).forEach(([categoria, cantidad]) => {
      if (cantidad > 0) {
        movimientosHuevo.push({
          fecha: registro.fecha,
          categoria,
          tipo: 'SALIDA',
          cantidad,
          referenciaRegistroId: registro.id,
        })
      }
    })

    if (movimientosAlimento.length) {
      await prisma.movimientoAlimento.createMany({ data: movimientosAlimento })
    }
    if (movimientosAves.length) {
      await prisma.movimientoAves.createMany({ data: movimientosAves })
    }
    if (movimientosHuevo.length) {
      await prisma.movimientoHuevo.createMany({ data: movimientosHuevo })
    }
  } catch (error) {
    console.error('Error creando movimientos de inventario:', error)
  }
}



