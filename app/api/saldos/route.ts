import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Permitir a Encargado, Supervisor y Operario
    if (
      session.user.role !== 'ENCARGADO' &&
      session.user.role !== 'SUPERVISOR' &&
      session.user.role !== 'OPERARIO'
    ) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dias = parseInt(searchParams.get('dias') || '7')
    const hoy = startOfDay(new Date())
    const fechaInicio = subDays(hoy, dias - 1)

    // Movimientos de alimento
    const movAlimento = await prisma.movimientoAlimento.findMany({
      where: { fecha: { gte: fechaInicio, lte: new Date() } },
    })
    const alimentoHembraIngresos = movAlimento.filter(m => m.sexo === 'HEMBRA' && m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.cantidadKg), 0)
    const alimentoHembraConsumos = movAlimento.filter(m => m.sexo === 'HEMBRA' && m.tipo === 'CONSUMO').reduce((s, m) => s + Number(m.cantidadKg), 0)
    const alimentoMachoIngresos = movAlimento.filter(m => m.sexo === 'MACHO' && m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.cantidadKg), 0)
    const alimentoMachoConsumos = movAlimento.filter(m => m.sexo === 'MACHO' && m.tipo === 'CONSUMO').reduce((s, m) => s + Number(m.cantidadKg), 0)

    const alimentoSaldoHembra = alimentoHembraIngresos - alimentoHembraConsumos
    const alimentoSaldoMacho = alimentoMachoIngresos - alimentoMachoConsumos

    // Movimientos de aves
    const movAves = await prisma.movimientoAves.findMany({
      where: { fecha: { gte: fechaInicio, lte: new Date() } },
    })
    const avesHembraIngresos = movAves.filter(m => m.sexo === 'HEMBRA' && m.tipo === 'INGRESO').reduce((s, m) => s + m.cantidad, 0)
    const avesHembraMortalidad = movAves.filter(m => m.sexo === 'HEMBRA' && m.tipo === 'MORTALIDAD').reduce((s, m) => s + m.cantidad, 0)
    const avesMachoIngresos = movAves.filter(m => m.sexo === 'MACHO' && m.tipo === 'INGRESO').reduce((s, m) => s + m.cantidad, 0)
    const avesMachoMortalidad = movAves.filter(m => m.sexo === 'MACHO' && m.tipo === 'MORTALIDAD').reduce((s, m) => s + m.cantidad, 0)

    // Movimientos de huevos
    const movHuevos = await prisma.movimientoHuevo.findMany({
      where: { fecha: { gte: fechaInicio, lte: new Date() } },
    })
    function saldoHuevos(categoria: string) {
      const ing = movHuevos.filter(m => m.categoria === categoria && m.tipo === 'INGRESO').reduce((s, m) => s + m.cantidad, 0)
      const sal = movHuevos.filter(m => m.categoria === categoria && m.tipo === 'SALIDA').reduce((s, m) => s + m.cantidad, 0)
      return ing - sal
    }
    const produccion = {
      fertilA: saldoHuevos('FERTIL_A'),
      fertilB: saldoHuevos('FERTIL_B'),
      jumbo: saldoHuevos('JUMBO'),
      grande: saldoHuevos('GRANDE'),
      mediano: saldoHuevos('MEDIANO'),
      pequeno: saldoHuevos('PEQUENO'),
      picado: saldoHuevos('PICADO'),
      desecho: saldoHuevos('DESECHO'),
    }

    const totales = {
      alimentoTotal: alimentoSaldoHembra + alimentoSaldoMacho,
      mortalidadTotal: avesHembraMortalidad + avesMachoMortalidad,
      produccionTotal: Object.values(produccion).reduce((a, b) => a + (b as number), 0),
      produccionFertil: produccion.fertilA + produccion.fertilB,
      produccionComercial: produccion.jumbo + produccion.grande + produccion.mediano + produccion.pequeno + produccion.picado,
      produccionDescartado: produccion.desecho,
    }

    return NextResponse.json({
      periodoDias: dias,
      fechaInicio,
      fechaFin: hoy,
      alimento: { hembra: alimentoSaldoHembra, macho: alimentoSaldoMacho, total: totales.alimentoTotal },
      mortalidad: { hembra: avesHembraMortalidad, macho: avesMachoMortalidad, total: totales.mortalidadTotal },
      produccion: {
        ...produccion,
        total: totales.produccionTotal,
        fertil: totales.produccionFertil,
        comercial: totales.produccionComercial,
        descartado: totales.produccionDescartado,
      },
    })
  } catch (error) {
    console.error('Error fetching saldos:', error)
    return NextResponse.json({ error: 'Error al cargar saldos' }, { status: 500 })
  }
}


